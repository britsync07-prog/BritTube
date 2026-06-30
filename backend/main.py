import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.realpath(__file__)), ".env"))

# Add current directory to sys.path
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

from fastapi.staticfiles import StaticFiles
from app.routes import auth as auth_router
from app.core.config import config
from app.core.rate_limit import limiter, rate_limit_handler, AUTH_RATE, VIDEO_RATE
from app.core.monitoring import setup_logging, RequestLoggingMiddleware, metrics
from app.models.exception import HttpException
from app.utils import utils
from app.db.database import engine, Base
from app.models.user import User
from app.models.task import Task
from app.models.api_key import ApiKey

# Auto-create tables
Base.metadata.create_all(bind=engine)

# Import routes
from app.routes.video import router as video_router
from app.routes.admin import router as admin_router
from app.routes.api_keys import router as api_keys_router
from app.routes.external_api import router as external_api_router

# Setup logging
setup_logging()

# Background scheduler for cleanup
scheduler = BackgroundScheduler()


def scheduled_cleanup():
    """Run cleanup job."""
    from app.services.cleanup import cleanup_old_videos, get_storage_usage
    try:
        cleanup_old_videos(max_age_days=7, max_storage_gb=10)
        usage = get_storage_usage()
        logger.info(f"Storage: {usage['total_size_mb']}MB across {usage['task_count']} tasks")
    except Exception as e:
        logger.error(f"Cleanup job failed: {e}")


def exception_handler(request: Request, e: HttpException):
    return JSONResponse(
        status_code=e.status_code,
        content=utils.get_response(e.status_code, e.data, e.message),
    )


def validation_exception_handler(request: Request, e: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content=utils.get_response(status=400, data=e.errors(), message="field required"),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("BritTube server starting...")
    scheduler.add_job(scheduled_cleanup, "interval", hours=6, id="cleanup")
    scheduler.start()
    logger.info("Background scheduler started (cleanup every 6 hours)")
    yield
    # Shutdown
    scheduler.shutdown()
    logger.info("BritTube server shutdown")


app = FastAPI(
    title="BritTube",
    description="BritTube AI Video Generation API",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(429, rate_limit_handler)

app.add_exception_handler(HttpException, exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# CORS
cors_origins_str = os.getenv("CORS_ORIGINS", "")
cors_origins = [o.strip() for o in cors_origins_str.split(",")] if cors_origins_str else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Body size limit
MAX_BODY_SIZE = 10 * 1024 * 1024

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    return await call_next(request)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# Security headers
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount static files
task_dir = utils.task_dir()
app.mount("/tasks", StaticFiles(directory=task_dir, html=True, follow_symlink=True), name="tasks")

# Include routers with rate limits
app.include_router(video_router, prefix="/api/v1", tags=["Video"])
app.include_router(admin_router, prefix="/api/v1", tags=["Admin"])
app.include_router(api_keys_router, prefix="/api/v1/admin", tags=["API Keys"])
app.include_router(external_api_router, prefix="/api/external", tags=["External API"])
app.include_router(auth_router.router, prefix="/api/v1", tags=["Auth"])

@app.get("/")
async def root():
    return {"message": "Welcome to BritTube API", "version": "1.0.0"}

@app.get("/health")
async def health():
    from app.services.cleanup import get_storage_usage
    usage = get_storage_usage()
    return {
        "status": "healthy",
        "version": "1.0.0",
        "storage": usage,
        "metrics": metrics.get_metrics(),
    }

@app.get("/metrics")
async def get_metrics():
    """Public metrics endpoint for monitoring."""
    from app.services.cleanup import get_storage_usage
    return {
        "metrics": metrics.get_metrics(),
        "storage": get_storage_usage(),
    }


if __name__ == "__main__":
    import uvicorn
    listen_host = config.get("listen_host", "0.0.0.0")
    listen_port = config.get("listen_port", 9090)
    logger.info(f"Starting BritTube on {listen_host}:{listen_port}")
    uvicorn.run("main:app", host=listen_host, port=listen_port, reload=False)

import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.realpath(__file__)), ".env"))

# Add the current directory to sys.path to allow absolute imports from 'app'
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

from fastapi.staticfiles import StaticFiles
from app.routes import video
from app.routes import auth as auth_router
from app.core.config import listen_host, listen_port, project_name, project_version
from app.utils.utils import storage_dir
from app.db.database import engine, Base

from app.models.user import User
from app.models.task import Task
# Auto-create all tables (Users, Tasks, etc.)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=project_name,
    version=project_version,
    description="BritTube Backend API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# H4 Fix: Reject requests larger than 10 MB to prevent DoS
MAX_BODY_SIZE = 10 * 1024 * 1024  # 10 MB

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    return await call_next(request)


# Mount static files for tasks
app.mount("/tasks", StaticFiles(directory=storage_dir("tasks")), name="tasks")

# Include routers
app.include_router(video.router, prefix="/api/v1", tags=["Video"])
app.include_router(auth_router.router, prefix="/api/v1", tags=["Auth"])

@app.get("/")
async def root():
    return {"message": f"Welcome to {project_name} API", "version": project_version}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {project_name} on {listen_host}:{listen_port}")
    uvicorn.run("main:app", host=listen_host, port=listen_port, reload=False)

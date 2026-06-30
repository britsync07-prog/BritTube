"""
Monitoring and logging configuration.
Structured logging with loguru + request tracking.
"""
import os
import sys
import time
from datetime import datetime
from loguru import logger
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


def setup_logging():
    """Configure loguru with structured output."""
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
    os.makedirs(log_dir, exist_ok=True)

    # Remove default handler
    logger.remove()

    # Console handler with colors
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
        colorize=True,
    )

    # File handler - all logs
    logger.add(
        os.path.join(log_dir, "app_{time:YYYY-MM-DD}.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        rotation="00:00",     # New file each day
        retention="30 days",  # Keep 30 days
        compression="zip",
    )

    # Error file handler
    logger.add(
        os.path.join(log_dir, "error_{time:YYYY-MM-DD}.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="00:00",
        retention="90 days",
    )

    # Video generation log
    logger.add(
        os.path.join(log_dir, "video_gen_{time:YYYY-MM-DD}.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {message}",
        level="INFO",
        rotation="00:00",
        retention="14 days",
        filter=lambda record: "video" in record["name"].lower() or "task" in record["name"].lower(),
    )

    logger.info("Logging configured")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests with timing."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"

        # Skip static file logging
        if request.url.path.startswith("/tasks/") or request.url.path.startswith("/docs"):
            return await call_next(request)

        response = await call_next(request)
        duration = time.time() - start_time

        logger.info(
            f"{request.method} {request.url.path} | "
            f"{response.status_code} | "
            f"{duration:.3f}s | "
            f"{client_ip}"
        )

        return response


class MetricsCollector:
    """Simple in-memory metrics collector."""

    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.video_count = 0
        self.active_tasks = 0
        self.start_time = datetime.utcnow()

    def record_request(self):
        self.request_count += 1

    def record_error(self):
        self.error_count += 1

    def record_video_created(self):
        self.video_count += 1

    def set_active_tasks(self, count: int):
        self.active_tasks = count

    def get_metrics(self) -> dict:
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        return {
            "uptime_seconds": int(uptime),
            "uptime_human": _format_uptime(uptime),
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "total_videos": self.video_count,
            "active_tasks": self.active_tasks,
            "error_rate": round(self.error_count / max(self.request_count, 1) * 100, 2),
        }


def _format_uptime(seconds: float) -> str:
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"


# Global metrics instance
metrics = MetricsCollector()

"""
External API for AI video generation.
Authenticates via X-API-Key header.
"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.models.api_key import ApiKey
from app.models.task import Task
from app.models.schema_mpt import TaskVideoRequest
from app.services import state as sm
from app.services import task as tm
from app.controllers.manager.memory_manager import InMemoryTaskManager
from app.controllers.manager.base_manager import TaskQueueFullError
from app.utils import utils
from app.core.config import config

router = APIRouter(prefix="/v1", tags=["External API"])

# Task manager for external API
_max_concurrent_tasks = config.get("max_concurrent_tasks", 5)
task_manager = InMemoryTaskManager(
    max_concurrent_tasks=_max_concurrent_tasks,
    max_queued_tasks=100,
)


def verify_api_key_header(x_api_key: str = Header(..., description="API key starting with bt_")):
    """Verify API key from header and return user_id."""
    db = SessionLocal()
    try:
        key_record = db.query(ApiKey).filter(
            ApiKey.key == x_api_key,
            ApiKey.is_active == True
        ).first()
        if not key_record:
            raise HTTPException(status_code=401, detail="Invalid or inactive API key")
        user_id = key_record.user_id
        # Update last used
        key_record.last_used_at = datetime.utcnow()
        db.commit()
        return user_id
    finally:
        db.close()


@router.post("/generate")
def generate_video_external(
    body: TaskVideoRequest,
    user_id: int = Depends(verify_api_key_header),
):
    """
    Generate a video using an API key.
    
    Headers:
        X-API-Key: your_api_key_here
    
    Body: Same as the internal /videos endpoint.
    
    Returns:
        task_id: Use to poll status at GET /api/external/v1/status/{task_id}
    """
    task_id = utils.get_uuid()

    try:
        # Save to database
        db = SessionLocal()
        try:
            db_task = Task(
                task_id=task_id,
                user_id=user_id,
                video_subject=body.video_subject,
                params=body.model_dump(),
                state=4,
                progress=0,
            )
            db.add(db_task)
            db.commit()
        finally:
            db.close()

        sm.state.update_task(task_id)
        task_manager.add_task(tm.start, task_id=task_id, params=body, stop_at="video")

        return {
            "status": "success",
            "task_id": task_id,
            "message": "Video generation started. Poll status endpoint for progress."
        }
    except TaskQueueFullError as e:
        sm.state.delete_task(task_id)
        raise HTTPException(status_code=429, detail="Server busy, try again later")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
def get_task_status_external(
    task_id: str,
    user_id: int = Depends(verify_api_key_header),
):
    """Check the status of a video generation task."""
    task = sm.state.get_task(task_id)

    if not task:
        # Check database
        db = SessionLocal()
        try:
            db_task = db.query(Task).filter(Task.task_id == task_id).first()
            if db_task:
                task = {
                    "task_id": db_task.task_id,
                    "state": db_task.state,
                    "progress": db_task.progress,
                    "video_url": db_task.video_url,
                    "videos": [db_task.video_url] if db_task.video_url else [],
                }
        finally:
            db.close()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    endpoint = config.get("endpoint", "").rstrip("/")
    response = dict(task)

    if "videos" in task:
        from app.utils import file_security
        task_dir = utils.task_dir()
        response["videos"] = []
        for v in task["videos"]:
            if isinstance(v, str) and not v.startswith(("http://", "https://")):
                try:
                    resolved = file_security.resolve_path_within_directory(task_dir, v)
                    relative = os.path.relpath(resolved, task_dir).replace("\\", "/")
                    if endpoint:
                        response["videos"].append(f"{endpoint.rstrip('/')}/tasks/{relative}")
                    else:
                        response["videos"].append(f"/tasks/{relative}")
                except ValueError:
                    response["videos"].append(v)
            else:
                response["videos"].append(v)

    state_map = {1: "completed", 4: "processing", -1: "failed"}
    response["status"] = state_map.get(task.get("state", 4), "unknown")

    return response


@router.get("/stream/{file_path:path}")
async def stream_video_external(
    file_path: str,
    user_id: int = Depends(verify_api_key_header),
):
    """Stream a video file."""
    from fastapi.responses import StreamingResponse
    from app.utils import file_security

    tasks_dir = utils.task_dir()
    try:
        video_path = file_security.resolve_path_within_directory(tasks_dir, file_path)
    except ValueError:
        raise HTTPException(status_code=404, detail="File not found")

    video_size = os.path.getsize(video_path)

    def file_iterator(path, offset=0, length=None):
        with open(path, "rb") as f:
            f.seek(offset)
            remaining = length or video_size
            while remaining > 0:
                chunk = min(4096, remaining)
                data = f.read(chunk)
                if not data:
                    break
                remaining -= len(data)
                yield data

    response = StreamingResponse(
        file_iterator(video_path), media_type="video/mp4"
    )
    response.headers["Content-Length"] = str(video_size)
    return response

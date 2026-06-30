import os
import glob
import pathlib
import shutil
from typing import Union

from fastapi import APIRouter, BackgroundTasks, Depends, Path, Query, Request, UploadFile
from fastapi.params import File
from fastapi.responses import FileResponse, StreamingResponse
from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import config
from app.controllers import base
from app.controllers.manager.base_manager import TaskQueueFullError
from app.controllers.manager.memory_manager import InMemoryTaskManager
from app.controllers.manager.redis_manager import RedisTaskManager
from app.models.exception import HttpException
from app.models.schema_mpt import (
    TaskVideoRequest,
    TaskResponse,
    TaskQueryResponse,
    TaskQueryRequest,
    TaskDeletionResponse,
    BgmRetrieveResponse,
    BgmUploadResponse,
)
from app.services import state as sm
from app.services import task as tm
from app.utils import file_security, utils
from app.core.security import get_current_user
from app.core.rate_limit import limiter, VIDEO_RATE
from app.core.monitoring import metrics
from app.db.database import get_db, SessionLocal
from app.models.task import Task

router = APIRouter()

# Task manager setup
_enable_redis = config.get("enable_redis", False)
_max_concurrent_tasks = config.get("max_concurrent_tasks", 5)
_max_queued_tasks = config.get("max_queued_tasks", 100)

if _enable_redis:
    _redis_host = config.get("redis_host", "localhost")
    _redis_port = config.get("redis_port", 6379)
    _redis_db = config.get("redis_db", 0)
    _redis_password = config.get("redis_password", "")
    if _redis_password:
        redis_url = f"redis://:{_redis_password}@{_redis_host}:{_redis_port}/{_redis_db}"
    else:
        redis_url = f"redis://{_redis_host}:{_redis_port}/{_redis_db}"
    task_manager = RedisTaskManager(
        max_concurrent_tasks=_max_concurrent_tasks,
        redis_url=redis_url,
        max_queued_tasks=_max_queued_tasks,
    )
else:
    task_manager = InMemoryTaskManager(
        max_concurrent_tasks=_max_concurrent_tasks,
        max_queued_tasks=_max_queued_tasks,
    )


def _sanitize_upload_filename(filename: str, request_id: str) -> str:
    normalized_name = (filename or "").replace("\\", "/").split("/")[-1].strip()
    if not normalized_name or normalized_name in {".", ".."}:
        raise HttpException(
            task_id=request_id,
            status_code=400,
            message=f"{request_id}: invalid filename",
        )
    return normalized_name


def _resolve_path_within_directory(base_dir: str, unsafe_path: str, request_id: str) -> str:
    try:
        return file_security.resolve_path_within_directory(base_dir, unsafe_path)
    except ValueError as exc:
        logger.warning(
            f"reject unsafe file path, request_id: {request_id}, path: {unsafe_path}, "
            f"error: {str(exc)}"
        )
        raise HttpException(
            task_id=request_id,
            status_code=404 if str(exc) == "file does not exist" else 403,
            message=f"{request_id}: invalid file path",
        )


def _task_file_to_uri(file: str, endpoint: str, task_dir: str, request_id: str) -> str:
    if not isinstance(file, str):
        return file
    if file.startswith(("http://", "https://")):
        return file
    try:
        resolved_path = file_security.resolve_path_within_directory(task_dir, file)
    except ValueError:
        return file
    relative_path = os.path.relpath(resolved_path, task_dir).replace("\\", "/")
    uri_path = f"tasks/{relative_path}"
    if endpoint:
        return f"{endpoint.rstrip('/')}/{uri_path}"
    return f"/{uri_path}"


def _update_db_state(task_id: str, state: int, progress: int = None, video_url: str = None):
    db = SessionLocal()
    try:
        db_task = db.query(Task).filter(Task.task_id == task_id).first()
        if db_task:
            db_task.state = state
            if progress is not None:
                db_task.progress = progress
            if video_url:
                db_task.video_url = video_url
            db.commit()
    finally:
        db.close()


# ==================== VIDEO GENERATION ====================

@router.post("/videos", response_model=TaskResponse, summary="Generate a video")
@limiter.limit(VIDEO_RATE)
def create_video(
    request: Request,
    body: TaskVideoRequest,
    token_payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task_id = utils.get_uuid()
    request_id = base.get_task_id(request)
    user_id = int(token_payload.get("sub", 0))

    try:
        # Save to database
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

        sm.state.update_task(task_id)
        task_manager.add_task(tm.start, task_id=task_id, params=body, stop_at="video")
        metrics.record_video_created()
        logger.success(f"Task created: {task_id}")
        return utils.get_response(200, {"task_id": task_id, "request_id": request_id})
    except TaskQueueFullError as e:
        sm.state.delete_task(task_id)
        raise HttpException(
            task_id=task_id, status_code=429, message=f"{request_id}: {str(e)}"
        )
    except ValueError as e:
        raise HttpException(
            task_id=task_id, status_code=400, message=f"{request_id}: {str(e)}"
        )


# ==================== TASK HISTORY (must be before /tasks/{task_id}) ====================

@router.get("/tasks/history", summary="Get user's task history")
def get_task_history(
    token_payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub", 0))
    tasks = db.query(Task).filter(Task.user_id == user_id).order_by(Task.created_at.desc()).all()
    endpoint = config.get("endpoint", "").rstrip("/")

    result = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "task_id": task.task_id,
            "video_subject": task.video_subject,
            "video_url": task.video_url,
            "state": task.state,
            "progress": task.progress,
            "created_at": task.created_at,
        }
        if task_dict["video_url"] and isinstance(task_dict["video_url"], str):
            if os.path.isabs(task_dict["video_url"]):
                filename = os.path.basename(task_dict["video_url"])
                task_dict["video_url"] = f"/tasks/{task.task_id}/{filename}"
        result.append(task_dict)
    return result


# ==================== TASK STATUS ====================

@router.get("/tasks/{task_id}", summary="Query task status")
def get_task(
    request: Request,
    task_id: str = Path(..., description="Task ID"),
):
    request_id = base.get_task_id(request)
    endpoint = config.get("endpoint", "").rstrip("/")
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
        raise HttpException(
            task_id=task_id, status_code=404, message=f"{request_id}: task not found"
        )

    response_task = dict(task)
    task_dir = utils.task_dir()

    if "videos" in task:
        response_task["videos"] = [
            _task_file_to_uri(v, endpoint, task_dir, request_id)
            for v in task["videos"]
        ]

    # Update database state
    _update_db_state(
        task_id,
        task.get("state", 4),
        task.get("progress", 0),
        task.get("videos", [None])[0] if task.get("videos") else None,
    )

    return utils.get_response(200, response_task)


# ==================== DELETE TASK ====================

@router.delete("/tasks/{task_id}", summary="Delete a task")
def delete_video(
    request: Request,
    task_id: str = Path(..., description="Task ID"),
    token_payload: dict = Depends(get_current_user),
):
    request_id = base.get_task_id(request)
    user_id = int(token_payload.get("sub", 0))
    
    # Check task exists and belongs to user
    db = SessionLocal()
    try:
        db_task = db.query(Task).filter(Task.task_id == task_id).first()
        if not db_task:
            raise HttpException(task_id=task_id, status_code=404, message=f"{request_id}: task not found")
        if db_task.user_id != user_id:
            raise HttpException(task_id=task_id, status_code=403, message="Not authorized to delete this task")
    finally:
        db.close()
    
    tasks_dir = utils.task_dir()
    current_task_dir = os.path.join(tasks_dir, task_id)
    if os.path.exists(current_task_dir):
        shutil.rmtree(current_task_dir)
    sm.state.delete_task(task_id)
    
    # Also delete from DB
    db = SessionLocal()
    try:
        db.query(Task).filter(Task.task_id == task_id).delete()
        db.commit()
    finally:
        db.close()
    
    return utils.get_response(200)


# ==================== BGM ====================

@router.get("/musics", summary="List BGM files")
def get_bgm_list(request: Request):
    suffix = "*.mp3"
    song_dir = utils.song_dir()
    files = glob.glob(os.path.join(song_dir, suffix))
    bgm_list = []
    for file in files:
        filename = os.path.basename(file)
        bgm_list.append({
            "name": filename,
            "size": os.path.getsize(file),
            "file": filename,
        })
    return utils.get_response(200, {"files": bgm_list})


@router.post("/musics", summary="Upload BGM file")
def upload_bgm_file(request: Request, file: UploadFile = File(...)):
    request_id = base.get_task_id(request)
    safe_filename = _sanitize_upload_filename(file.filename, request_id)
    if safe_filename.lower().endswith("mp3"):
        song_dir = utils.song_dir()
        save_path = os.path.join(song_dir, safe_filename)
        with open(save_path, "wb+") as buffer:
            file.file.seek(0)
            buffer.write(file.file.read())
        return utils.get_response(200, {"file": safe_filename})

    raise HttpException(
        "", status_code=400, message=f"{request_id}: Only *.mp3 files can be uploaded"
    )


# ==================== STREAMING ====================

@router.get("/stream/{file_path:path}")
async def stream_video(
    request: Request,
    file_path: str,
    token_payload: dict = Depends(get_current_user),
):
    request_id = base.get_task_id(request)
    tasks_dir = utils.task_dir()
    video_path = _resolve_path_within_directory(tasks_dir, file_path, request_id)
    video_size = os.path.getsize(video_path)
    start, end = 0, video_size - 1
    length = video_size

    range_header = request.headers.get("Range")
    if range_header:
        try:
            range_ = range_header.split("bytes=")[1]
            parts = range_.split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if len(parts) > 1 and parts[1] else video_size - 1
            length = end - start + 1
        except (ValueError, IndexError):
            start, end, length = 0, video_size - 1, video_size

    def file_iterator(path, offset=0, read_length=None):
        with open(path, "rb") as f:
            f.seek(offset, os.SEEK_SET)
            remaining = read_length or video_size
            while remaining > 0:
                chunk = min(4096, remaining)
                data = f.read(chunk)
                if not data:
                    break
                remaining -= len(data)
                yield data

    response = StreamingResponse(
        file_iterator(video_path, start, length), media_type="video/mp4"
    )
    response.headers["Content-Range"] = f"bytes {start}-{end}/{video_size}"
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Content-Length"] = str(length)
    response.status_code = 206
    return response


@router.get("/download/{file_path:path}")
async def download_video(
    request: Request,
    file_path: str,
    token_payload: dict = Depends(get_current_user),
):
    request_id = base.get_task_id(request)
    tasks_dir = utils.task_dir()
    video_path = _resolve_path_within_directory(tasks_dir, file_path, request_id)
    file_path_obj = pathlib.Path(video_path)
    filename = file_path_obj.stem
    extension = file_path_obj.suffix
    headers = {"Content-Disposition": f"attachment; filename={filename}{extension}"}
    return FileResponse(
        path=video_path,
        headers=headers,
        filename=f"{filename}{extension}",
        media_type=f"video/{extension[1:]}",
    )

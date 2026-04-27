import os
import uuid
from loguru import logger
from app.services import task as task_service
from app.models.schema import VideoParams
from app.utils import utils

from sqlalchemy.orm import Session
from app.models.task import Task
from app.db.database import SessionLocal

class VideoController:
    @staticmethod
    def create_task(db: Session, params: VideoParams, user_id: int):
        task_id = utils.get_uuid()
        logger.info(f"creating task {task_id} for user {user_id}")
        
        # 1. Create database record
        db_task = Task(
            task_id=task_id,
            user_id=user_id,
            video_subject=params.video_subject,
            params=params.dict(),
            state=4, # processing
            progress=0
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        # 2. Start task in background
        utils.run_in_background(task_service.start, task_id, params)
        
        return {"task_id": task_id}

    @staticmethod
    def get_task_status(task_id: str):
        # First try memory/redis state (for real-time progress)
        from app.services import state as sm
        task_info = sm.state.get_task(task_id)
        
        # If not in memory (maybe worker finished), check database
        if not task_info:
            db = SessionLocal()
            try:
                db_task = db.query(Task).filter(Task.task_id == task_id).first()
                if db_task:
                    task_info = {
                        "task_id": db_task.task_id,
                        "id": db_task.task_id,
                        "state": db_task.state,
                        "progress": db_task.progress,
                        "video_url": db_task.video_url,
                        "message": "",
                        "videos": [db_task.video_url] if db_task.video_url else []
                    }
            finally:
                db.close()
                
        if not task_info:
            return {"status": "error", "message": "task not found"}
        
        # Convert absolute paths to URLs if they are still paths
        if "videos" in task_info and task_info["videos"]:
            new_videos = []
            for v_path in task_info["videos"]:
                if v_path and isinstance(v_path, str) and os.path.isabs(v_path):
                    filename = os.path.basename(v_path)
                    url = f"/tasks/{task_id}/{filename}"
                    new_videos.append(url)
                else:
                    new_videos.append(v_path)
            task_info["videos"] = new_videos
            task_info["video_url"] = new_videos[0] if new_videos else ""
            
        # Ensure required fields
        if "id" not in task_info:
            task_info["id"] = task_info.get("task_id", task_id)
        
        return task_info

    @staticmethod
    def list_tasks(db: Session, user_id: int):
        tasks = db.query(Task).filter(Task.user_id == user_id).order_by(Task.created_at.desc()).all()
        return tasks

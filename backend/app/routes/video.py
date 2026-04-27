from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.schema import VideoParams
from app.controllers.video_controller import VideoController
from app.db.database import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.post("/tasks")
async def create_task(
    params: VideoParams, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])
    return VideoController.create_task(db, params, user_id)

@router.get("/tasks/history")
async def list_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])
    return VideoController.list_tasks(db, user_id)

@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    # Status check remains public for simplicity (sharing links), 
    # but could be protected if needed.
    status = VideoController.get_task_status(task_id)
    if "status" in status and status["status"] == "error":
        raise HTTPException(status_code=404, detail=status["message"])
    return status

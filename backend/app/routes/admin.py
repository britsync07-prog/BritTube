import os
import shutil
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task
from app.core.security import get_current_user, hash_password
from app.schemas.auth import UserOut, UserCreate

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(token_payload: dict = Depends(get_current_user)):
    """Dependency that ensures the current user is an admin."""
    user_id = int(token_payload.get("sub", 0))
    return user_id


@router.get("/stats")
def get_admin_stats(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get system statistics."""
    # Verify admin
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_tasks = db.query(func.count(Task.id)).scalar()
    completed_tasks = db.query(func.count(Task.id)).filter(Task.state == 1).scalar()
    failed_tasks = db.query(func.count(Task.id)).filter(Task.state == -1).scalar()
    processing_tasks = db.query(func.count(Task.id)).filter(Task.state == 4).scalar()

    # Storage usage
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))), "storage")
    total_size = 0
    file_count = 0
    if os.path.exists(storage_dir):
        for dirpath, dirnames, filenames in os.walk(storage_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)
                file_count += 1

    # Recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar()
    new_tasks_week = db.query(func.count(Task.id)).filter(Task.created_at >= week_ago).scalar()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "failed_tasks": failed_tasks,
        "processing_tasks": processing_tasks,
        "storage_bytes": total_size,
        "storage_mb": round(total_size / 1024 / 1024, 1),
        "file_count": file_count,
        "new_users_week": new_users_week,
        "new_tasks_week": new_tasks_week,
    }


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by email or name"),
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with pagination and search."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(User)
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "users": [UserOut.model_validate(u).model_dump() for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str = Query(..., description="New role: user or admin"),
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a user's role."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    return {"message": f"User {user_id} role updated to {role}"}


@router.put("/users/{user_id}/plan")
def update_user_plan(
    user_id: int,
    plan: str = Query(..., description="New plan: free, pro, or enterprise"),
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a user's plan."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if plan not in ("free", "pro", "enterprise"):
        raise HTTPException(status_code=400, detail="Invalid plan")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = plan
    db.commit()
    return {"message": f"User {user_id} plan updated to {plan}"}


@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Toggle user active/inactive status."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {user_id} {'activated' if user.is_active else 'deactivated'}"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user and their tasks."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete user's tasks
    db.query(Task).filter(Task.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted"}


@router.get("/tasks")
def list_all_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    state: int = Query(None, description="Filter by state: 1=complete, 4=processing, -1=failed"),
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all tasks across all users."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(Task)
    if state is not None:
        query = query.filter(Task.state == state)

    total = query.count()
    tasks = query.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for t in tasks:
        task_dict = {
            "id": t.id,
            "task_id": t.task_id,
            "user_id": t.user_id,
            "video_subject": t.video_subject,
            "video_url": t.video_url,
            "state": t.state,
            "progress": t.progress,
            "created_at": t.created_at,
        }
        if task_dict["video_url"] and isinstance(task_dict["video_url"], str) and os.path.isabs(task_dict["video_url"]):
            filename = os.path.basename(task_dict["video_url"])
            task_dict["video_url"] = f"/tasks/{t.task_id}/{filename}"
        result.append(task_dict)

    return {"tasks": result, "total": total, "page": page, "page_size": page_size}


@router.delete("/tasks/{task_id}")
def admin_delete_task(
    task_id: str,
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin delete any task."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete task files
    from app.utils import utils
    task_dir = utils.task_dir(task_id)
    if os.path.exists(task_dir):
        shutil.rmtree(task_dir)

    db.delete(task)
    db.commit()
    return {"message": f"Task {task_id} deleted"}


# ==================== STORAGE & MONITORING ====================

@router.get("/storage")
def get_storage_info(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get storage usage information."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.cleanup import get_storage_usage
    return get_storage_usage()


@router.post("/cleanup")
def trigger_cleanup(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manually trigger video cleanup."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.cleanup import cleanup_old_videos, get_storage_usage
    before = get_storage_usage()
    cleanup_old_videos(max_age_days=7, max_storage_gb=10)
    after = get_storage_usage()
    return {
        "message": "Cleanup completed",
        "before": before,
        "after": after,
        "freed_mb": round(before["total_size_mb"] - after["total_size_mb"], 1),
    }


@router.get("/metrics")
def get_system_metrics(
    admin_id: int = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get system metrics and monitoring data."""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.core.monitoring import metrics
    from app.services.cleanup import get_storage_usage
    return {
        "metrics": metrics.get_metrics(),
        "storage": get_storage_usage(),
    }

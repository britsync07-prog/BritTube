"""
Video cleanup service.
Periodically removes old video files to prevent disk filling up.
"""
import os
import shutil
import time
from datetime import datetime, timedelta
from loguru import logger

from app.utils import utils


def cleanup_old_videos(max_age_days: int = 7, max_storage_gb: float = 10):
    """
    Remove video files older than max_age_days OR when total storage exceeds max_storage_gb.
    """
    task_dir = utils.task_dir()
    if not os.path.exists(task_dir):
        return

    cutoff_time = time.time() - (max_age_days * 86400)
    deleted_count = 0
    freed_bytes = 0

    # First pass: delete old tasks
    for task_id in os.listdir(task_dir):
        task_path = os.path.join(task_dir, task_id)
        if not os.path.isdir(task_path):
            continue

        # Check directory age
        dir_mtime = os.path.getmtime(task_path)
        if dir_mtime < cutoff_time:
            size = _get_dir_size(task_path)
            shutil.rmtree(task_path)
            deleted_count += 1
            freed_bytes += size
            logger.info(f"Cleaned up old task: {task_id} ({size / 1024 / 1024:.1f} MB)")

    # Second pass: check total storage and delete oldest if over limit
    total_size = _get_dir_size(task_dir)
    max_bytes = max_storage_gb * 1024 * 1024 * 1024

    if total_size > max_bytes:
        # Get all task dirs sorted by modification time (oldest first)
        task_dirs = []
        for task_id in os.listdir(task_dir):
            task_path = os.path.join(task_dir, task_id)
            if os.path.isdir(task_path):
                task_dirs.append((task_path, os.path.getmtime(task_path)))
        task_dirs.sort(key=lambda x: x[1])

        for task_path, _ in task_dirs:
            if total_size <= max_bytes * 0.8:  # Stop at 80% of limit
                break
            size = _get_dir_size(task_path)
            shutil.rmtree(task_path)
            total_size -= size
            freed_bytes += size
            deleted_count += 1
            logger.info(f"Storage limit: cleaned task {os.path.basename(task_path)} ({size / 1024 / 1024:.1f} MB)")

    if deleted_count > 0:
        logger.info(f"Cleanup complete: {deleted_count} tasks removed, {freed_bytes / 1024 / 1024:.1f} MB freed")
    else:
        logger.debug("Cleanup: no old tasks to remove")


def get_storage_usage() -> dict:
    """Get current storage usage stats."""
    task_dir = utils.task_dir()
    cache_dir = os.path.join(os.path.dirname(task_dir), "cache_videos")

    task_size = _get_dir_size(task_dir) if os.path.exists(task_dir) else 0
    cache_size = _get_dir_size(cache_dir) if os.path.exists(cache_dir) else 0
    task_count = len(os.listdir(task_dir)) if os.path.exists(task_dir) else 0

    return {
        "task_size_mb": round(task_size / 1024 / 1024, 1),
        "cache_size_mb": round(cache_size / 1024 / 1024, 1),
        "total_size_mb": round((task_size + cache_size) / 1024 / 1024, 1),
        "task_count": task_count,
    }


def _get_dir_size(path: str) -> int:
    """Calculate total size of a directory."""
    total = 0
    try:
        for dirpath, _, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total += os.path.getsize(fp)
    except OSError:
        pass
    return total

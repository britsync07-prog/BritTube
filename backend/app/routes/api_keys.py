import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.api_key import ApiKey
from app.core.security import get_current_user

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


def require_admin_api(token_payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = int(token_payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id


def verify_api_key(api_key: str, db: Session) -> ApiKey:
    """Verify an API key and return the key record."""
    key_record = db.query(ApiKey).filter(ApiKey.key == api_key, ApiKey.is_active == True).first()
    if not key_record:
        raise HTTPException(status_code=401, detail="Invalid API key")
    # Update last used
    key_record.last_used_at = datetime.utcnow()
    db.commit()
    return key_record


@router.post("")
def create_api_key(
    name: str = Query(..., description="Name for this API key"),
    admin_id: int = Depends(require_admin_api),
    db: Session = Depends(get_db),
):
    """Create a new API key."""
    key = f"bt_{secrets.token_hex(32)}"
    api_key = ApiKey(
        key=key,
        name=name,
        user_id=admin_id,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return {
        "id": api_key.id,
        "key": api_key.key,
        "name": api_key.name,
        "created_at": api_key.created_at,
        "message": "Save this key - it won't be shown again"
    }


@router.get("")
def list_api_keys(
    admin_id: int = Depends(require_admin_api),
    db: Session = Depends(get_db),
):
    """List all API keys."""
    keys = db.query(ApiKey).order_by(ApiKey.created_at.desc()).all()
    return {
        "keys": [
            {
                "id": k.id,
                "key_preview": f"{k.key[:8]}...{k.key[-4:]}",
                "name": k.name,
                "user_id": k.user_id,
                "is_active": k.is_active,
                "created_at": k.created_at,
                "last_used_at": k.last_used_at,
            }
            for k in keys
        ]
    }


@router.delete("/{key_id}")
def revoke_api_key(
    key_id: int,
    admin_id: int = Depends(require_admin_api),
    db: Session = Depends(get_db),
):
    """Revoke (deactivate) an API key."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.is_active = False
    db.commit()
    return {"message": f"API key '{key.name}' revoked"}


@router.put("/{key_id}/toggle")
def toggle_api_key(
    key_id: int,
    admin_id: int = Depends(require_admin_api),
    db: Session = Depends(get_db),
):
    """Toggle API key active/inactive."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.is_active = not key.is_active
    db.commit()
    return {"message": f"API key {'activated' if key.is_active else 'deactivated'}"}

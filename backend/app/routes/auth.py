from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserOut
from app.controllers.auth import login_user, register_user
from app.core.security import get_current_user
from app.core.rate_limit import limiter, AUTH_RATE

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(AUTH_RATE)
def register(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user_create)


@router.post("/login", response_model=Token)
@limiter.limit(AUTH_RATE)
def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, credentials)


@router.get("/me", response_model=UserOut)
def me(
    token_payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id_raw = token_payload.get("sub")
    if not user_id_raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        user_id = int(user_id_raw)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or inactive")
    return user

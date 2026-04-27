from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_validation(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 72:
            # Bcrypt has a 72-byte limit
            raise ValueError("Password must be at most 72 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Full name must be at most 100 characters")
        return v

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        # Fix M4: normalize email to lowercase to prevent case-sensitive duplicate accounts
        return v.lower().strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip()


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    plan: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

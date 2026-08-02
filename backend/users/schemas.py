"""
User Schemas

Pydantic models for user CRUD operations.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserResponse(BaseModel):
    """Schema for returning user details."""

    id: str
    email: EmailStr
    full_name: str
    department: str
    role_id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user details."""

    full_name: str | None = None
    department: str | None = None
    role_id: str | None = None
    is_active: bool | None = None

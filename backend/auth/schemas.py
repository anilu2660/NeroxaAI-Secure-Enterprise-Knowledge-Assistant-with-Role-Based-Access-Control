"""
Authentication Schemas

Pydantic models for user registration, login, and JWT tokens.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class RegisterRequest(BaseModel):
    """Schema for user registration request."""

    email: EmailStr = Field(..., description="User's email address.")
    password: str = Field(..., min_length=6, description="Password (min 6 characters).")
    full_name: str = Field(..., min_length=2, description="User's full name.")
    department: str = Field(default="General", description="Department (HR, Finance, Engineering, Sales, General).")
    role: str = Field(default="employee", description="Target role (admin, hr, finance, engineering, sales, employee).")


class LoginRequest(BaseModel):
    """Schema for user login request."""

    email: EmailStr = Field(..., description="User's registered email address.")
    password: str = Field(..., description="User's password.")


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    department: str


class UserAuthInfo(BaseModel):
    """Authenticated user info schema."""

    id: str
    email: str
    full_name: str
    role: str
    department: str
    is_active: bool
    created_at: datetime

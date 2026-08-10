"""
Authentication Schemas

Pydantic models for user registration, login, and JWT tokens.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
import re


class RegisterRequest(BaseModel):
    """Schema for user registration request."""

    email: EmailStr = Field(..., description="User's email address.")
    password: str = Field(
        ...,
        min_length=12,
        description="Password (min 12 characters, must contain uppercase, lowercase, digit, special char).",
    )
    full_name: str = Field(..., min_length=2, description="User's full name.")
    department: str = Field(default="General", description="Department (HR, Finance, Engineering, Sales, General).")
    # SECURITY: 'role' field is accepted for documentation purposes only.
    # It is IGNORED server-side — all new users are assigned 'employee' role.
    role: str = Field(default="employee", description="Ignored on registration. All users start as employee.")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce enterprise password complexity policy."""
        errors = []
        if not re.search(r"[A-Z]", v):
            errors.append("at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("at least one digit")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':,./<>?]", v):
            errors.append("at least one special character (!@#$%^&* etc.)")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}.")
        return v


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

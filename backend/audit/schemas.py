"""
Audit Schemas

Pydantic models for compliance audit log records.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class AuditLogCreate(BaseModel):
    """Schema for logging a compliance event."""

    event_type: str = Field(..., description="Event type (login, upload, delete, query, unauthorized, role_update).")
    user_id: str | None = None
    user_email: str | None = None
    user_role: str | None = None
    action: str = Field(..., description="Action description.")
    resource: str | None = None
    ip_address: str | None = None
    details: dict | None = None


class AuditLogResponse(BaseModel):
    """Schema for audit log item output."""

    id: str
    event_type: str
    user_id: str | None
    user_email: str | None
    user_role: str | None
    action: str
    resource: str | None
    ip_address: str | None
    details: dict | None
    created_at: datetime

    class Config:
        from_attributes = True

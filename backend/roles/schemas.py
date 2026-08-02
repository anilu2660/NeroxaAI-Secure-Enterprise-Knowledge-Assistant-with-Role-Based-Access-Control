"""
Role Schemas

Pydantic models for RBAC roles and permissions management.
"""

from pydantic import BaseModel, Field


class RoleInfo(BaseModel):
    """Schema for role details and associated permissions."""

    name: str = Field(..., description="Role name (admin, hr, finance, engineering, sales, employee).")
    description: str = Field(..., description="Role description.")
    permissions: list[str] = Field(..., description="List of permissions granted to this role.")


class AssignRoleRequest(BaseModel):
    """Schema for assigning a role to a user (Admin only)."""

    user_id: str = Field(..., description="UUID of the user.")
    role: str = Field(..., description="Role name to assign.")


class PermissionCheckResponse(BaseModel):
    """Schema for permission validation response."""

    role: str
    permission: str
    allowed: bool

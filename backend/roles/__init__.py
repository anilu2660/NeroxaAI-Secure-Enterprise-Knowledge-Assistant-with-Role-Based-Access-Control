"""
Roles Module

Handles role and permission management for RBAC enforcement.
Roles: Admin, HR, Finance, Engineering, Sales, Employee
Permissions: Read, Upload, Delete, Share, Manage Users
"""

from backend.roles.service import RoleService, role_service
from backend.roles.middleware import require_permission, require_admin, get_current_user_role
from backend.roles.schemas import RoleInfo, AssignRoleRequest

__all__ = [
    "RoleService",
    "role_service",
    "require_permission",
    "require_admin",
    "get_current_user_role",
    "RoleInfo",
    "AssignRoleRequest",
]

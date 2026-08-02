"""
RBAC Middleware & Dependency Guards

FastAPI dependency functions for enforcing role and permission checks on API routes.
"""

import logging
from fastapi import Header, HTTPException, status
from backend.roles.service import role_service

logger = logging.getLogger(__name__)


def get_current_user_role(
    x_user_role: str = Header(default="employee", alias="X-User-Role"),
) -> str:
    """
    Extract user role from HTTP request header (X-User-Role).
    In Phase 2 auth, this will decode the JWT token.
    """
    return x_user_role.lower()


def require_permission(required_permission: str):
    """
    FastAPI Dependency Factory that checks if the requesting user's role
    possesses the specified permission.

    Usage:
        @router.post("/upload", dependencies=[Depends(require_permission("upload"))])
    """
    def permission_guard(role: str = Header(default="employee", alias="X-User-Role")):
        if not role_service.has_permission(role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Permission DENIED. Role '{role}' does not have "
                    f"'{required_permission}' permission."
                ),
            )
        return role

    return permission_guard


def require_admin(role: str = Header(default="employee", alias="X-User-Role")) -> str:
    """
    FastAPI Dependency Guard that restricts access strictly to Admin users.
    Used for sensitive operations like role assignment, audit logs, and user management.

    Usage:
        @router.post("/assign-role", dependencies=[Depends(require_admin)])
    """
    if not role_service.is_admin(role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Admin role required. Action forbidden for role '{role}'.",
        )
    return role

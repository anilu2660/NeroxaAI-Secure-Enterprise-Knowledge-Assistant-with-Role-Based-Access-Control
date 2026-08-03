"""
RBAC Middleware & Dependency Guards

FastAPI dependency functions for enforcing role and permission checks on API routes.
"""

import logging
from fastapi import Depends, Header, HTTPException, status
from backend.roles.service import role_service
from backend.api.dependencies import get_current_user
from backend.models.user import User

logger = logging.getLogger(__name__)


def get_current_user_role(current_user: User = Depends(get_current_user)) -> str:
    """
    FastAPI Dependency that extracts and returns the role string of the current user.
    """
    return current_user.role_id


def require_permission(required_permission: str):
    """
    FastAPI Dependency Factory that checks if the requesting user's authenticated role
    possesses the specified permission.
    Role is securely extracted from the verified JWT token.
    """
    def permission_guard(current_user: User = Depends(get_current_user)):
        role = current_user.role_id
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


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    FastAPI Dependency Guard that restricts access strictly to verified Admin users via JWT.
    Used for sensitive operations like role assignment, audit logs, and user management.
    """
    role = current_user.role_id
    if not role_service.is_admin(role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Admin role required. Action forbidden for role '{role}'.",
        )
    return current_user

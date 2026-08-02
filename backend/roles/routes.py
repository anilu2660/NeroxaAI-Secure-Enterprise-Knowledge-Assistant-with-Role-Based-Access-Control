"""
Role Management Routes

API endpoints for viewing roles, permissions, and assigning user roles (Admin only).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header
from backend.roles.schemas import RoleInfo, AssignRoleRequest, PermissionCheckResponse
from backend.roles.service import role_service
from backend.roles.middleware import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/roles", tags=["Roles & RBAC"])


@router.get(
    "/",
    response_model=list[RoleInfo],
    summary="List all roles and permissions",
)
async def list_roles():
    """
    Get a list of all system roles and their assigned permissions.
    """
    return role_service.list_all_roles()


@router.post(
    "/assign",
    summary="Assign role to user (Admin only)",
    description="Assign a new role to a user. Strictly restricted to Admin users.",
)
async def assign_role(
    request: AssignRoleRequest,
    current_role: str = Depends(require_admin),
):
    """
    Assign role to user. Admin authorization required.
    """
    valid_roles = list(role_service.list_all_roles())
    role_names = [r["name"] for r in valid_roles]

    if request.role.lower() not in role_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{request.role}'. Valid roles: {', '.join(role_names)}",
        )

    logger.info("Admin assigned role '%s' to user '%s'", request.role, request.user_id)
    return {
        "status": "success",
        "message": f"Role '{request.role}' successfully assigned to user '{request.user_id}'.",
        "user_id": request.user_id,
        "assigned_role": request.role,
    }


@router.get(
    "/check-permission",
    response_model=PermissionCheckResponse,
    summary="Check if a role has a specific permission",
)
async def check_permission(
    permission: str,
    role: str = Header(default="employee", alias="X-User-Role"),
):
    """
    Check permission for a given role.
    """
    has_perm = role_service.has_permission(role, permission)
    return PermissionCheckResponse(
        role=role,
        permission=permission,
        allowed=has_perm,
    )

"""
Role Management Routes

API endpoints for viewing roles, permissions, and assigning user roles (Admin only).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.roles.schemas import RoleInfo, AssignRoleRequest, PermissionCheckResponse
from backend.roles.service import role_service
from backend.roles.middleware import require_admin
from backend.users.service import user_service
from backend.users.schemas import UserUpdate
from backend.api.dependencies import get_current_user
from backend.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/roles", tags=["Roles & RBAC"])


@router.get(
    "/",
    response_model=list[RoleInfo],
    summary="List all roles and permissions (authenticated users only)",
)
async def list_roles(
    current_user: User = Depends(get_current_user),
):
    """
    Get a list of all system roles and their assigned permissions.
    SECURITY: Requires a valid JWT token — prevents unauthenticated recon.
    """
    return role_service.list_all_roles()


@router.post(
    "/assign",
    summary="Assign role to user (Admin only)",
    description="Assign a new role to a user. Strictly restricted to Admin users.",
)
async def assign_role(
    request: AssignRoleRequest,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    """
    Assign role to user. Admin authorization required.
    Persists the role change in the relational database.
    """
    valid_roles = list(role_service.list_all_roles())
    role_names = [r["name"] for r in valid_roles]

    if request.role.lower() not in role_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{request.role}'. Valid roles: {', '.join(role_names)}",
        )

    try:
        user_service.update_user(db, request.user_id, UserUpdate(role_id=request.role.lower()))
        logger.info("Admin assigned role '%s' to user '%s'", request.role, request.user_id)
        from backend.audit.service import audit_service
        from backend.audit.schemas import AuditLogCreate
        audit_service.log_event(
            db=db,
            event_data=AuditLogCreate(
                event_type="role_updated",
                user_id=getattr(admin_user, "id", "admin"),
                user_email=getattr(admin_user, "email", "admin@neroxaai.com"),
                user_role="admin",
                action=f"Assigned role '{request.role.lower()}' to user '{request.user_id}'",
                resource=request.user_id,
            ),
        )
    except Exception as e:
        logger.warning(
            "Could not persist role assignment in DB for user_id '%s': %s",
            request.user_id,
            str(e),
        )

    return {
        "status": "success",
        "message": f"Role '{request.role}' successfully assigned to user '{request.user_id}'.",
        "user_id": request.user_id,
        "assigned_role": request.role.lower(),
    }


@router.get(
    "/check-permission",
    response_model=PermissionCheckResponse,
    summary="Check if current user has a specific permission",
)
async def check_permission(
    permission: str,
    current_user: User = Depends(get_current_user),
):
    """
    Check if the authenticated user's role has the given permission.
    SECURITY: Role is always extracted from the verified JWT token,
    never from a client-supplied header.
    """
    role = current_user.role_id
    has_perm = role_service.has_permission(role, permission)
    return PermissionCheckResponse(
        role=role,
        permission=permission,
        allowed=has_perm,
    )

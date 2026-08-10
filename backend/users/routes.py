"""
User Routes

API endpoints for managing user profiles and accounts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.users.schemas import UserResponse, UserUpdate
from backend.users.service import user_service
from backend.roles.middleware import require_admin
from backend.api.dependencies import get_current_user
from backend.models.user import User

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get(
    "/",
    response_model=list[UserResponse],
    summary="List all users (Admin only)",
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_role: str = Depends(require_admin),
):
    """
    List all user accounts in the enterprise system. Admin only.
    """
    return user_service.list_users(db, skip=skip, limit=limit)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID (Admin or self only)",
)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user profile details by UUID.
    SECURITY: Only accessible by Admin or the user themselves.
    """
    from backend.roles.service import role_service
    if not role_service.is_admin(current_user.role_id) and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access DENIED. You can only view your own profile.",
        )
    return user_service.get_by_id(db, user_id)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user details",
)
def update_user(
    user_id: str,
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    admin_role: str = Depends(require_admin),
):
    """
    Update user profile or role assignment. Admin only.
    """
    return user_service.update_user(db, user_id, update_data)


@router.delete(
    "/{user_id}",
    summary="Delete user (Admin only)",
)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_role: str = Depends(require_admin),
):
    """
    Delete a user account. Admin only.
    """
    success = user_service.delete_user(db, user_id)
    return {"status": "deleted", "user_id": user_id, "success": success}

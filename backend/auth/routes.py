"""
Authentication Routes

API endpoints for user registration, login, and token generation.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserAuthInfo
from backend.auth.service import auth_service
from backend.api.dependencies import get_current_user
from backend.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserAuthInfo,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new enterprise user.
    """
    user = auth_service.register_user(db, request)

    # Log audit event
    from backend.audit.service import audit_service
    from backend.audit.schemas import AuditLogCreate
    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="user_registered",
            user_id=user.id,
            user_email=user.email,
            user_role=user.role_id,
            action=f"Registered user '{user.email}' with role '{user.role_id}'",
        ),
    )

    return UserAuthInfo(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role_id,
        department=user.department,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login and JWT token retrieval",
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with email and password, returning JWT access token.
    """
    user, token = auth_service.authenticate_user(db, request)

    # Log audit event
    from backend.audit.service import audit_service
    from backend.audit.schemas import AuditLogCreate
    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="user_login",
            user_id=user.id,
            user_email=user.email,
            user_role=user.role_id,
            action=f"User '{user.email}' logged in successfully",
        ),
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role_id,
        department=user.department,
    )


@router.get(
    "/me",
    response_model=UserAuthInfo,
    summary="Get current authenticated user",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Return currently authenticated user profile info.
    """
    return UserAuthInfo(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role_id,
        department=current_user.department,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )

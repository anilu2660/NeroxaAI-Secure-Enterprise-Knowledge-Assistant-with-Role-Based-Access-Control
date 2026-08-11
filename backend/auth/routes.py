"""
Authentication Routes

API endpoints for user registration, login, and token generation.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserAuthInfo
from backend.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserAuthInfo,
    InitiateRegistrationRequest,
    VerifyOTPRequest,
)
from backend.auth.service import auth_service
from backend.api.dependencies import get_current_user
from backend.models.user import User

from backend.utils.rate_limiter import rate_limit_guard

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/register/initiate",
    status_code=status.HTTP_200_OK,
    summary="Step 1: Send Gmail SMTP + Mobile SMS OTP for new user registration",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def initiate_registration(
    request: InitiateRegistrationRequest,
    db: Session = Depends(get_db),
):
    """
    Sends a 6-digit verification code to the user's Gmail address via Gmail SMTP,
    and a 6-digit Mobile SMS OTP to their phone number.
    Returns a session_token required for Step 2 verification.
    """
    return auth_service.initiate_registration(db, request)


@router.post(
    "/register/verify-otp",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Step 2: Verify Gmail & Mobile OTPs and complete user account creation",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def verify_otp_and_register(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Verifies the 6-digit Gmail SMTP email OTP and 6-digit Mobile SMS OTP.
    Upon verification, activates the account and returns a JWT access token.
    """
    user, token = auth_service.verify_otp_and_create_user(db, request)

    # Log audit event
    from backend.audit.service import audit_service
    from backend.audit.schemas import AuditLogCreate
    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="user_registered_otp",
            user_id=user.id,
            user_email=user.email,
            user_role=user.role_id,
            action=f"User '{user.email}' registered with verified Gmail SMTP & Mobile OTP",
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


@router.post(
    "/register",
    response_model=UserAuthInfo,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user directly",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new enterprise user directly.
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
    dependencies=[Depends(rate_limit_guard("auth"))],
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


from fastapi.responses import RedirectResponse
from backend.config import settings
from backend.auth.oauth_service import oauth_service
from backend.utils.exceptions import CredentialsException
from urllib.parse import quote_plus


@router.get(
    "/oauth/{provider}/login",
    summary="Redirect to social OAuth authorization URL",
)
def oauth_login(provider: str):
    """
    Redirects browser to social provider OAuth consent screen (Google, GitHub, Apple).
    """
    redirect_uri = f"http://localhost:8000/api/v1/auth/oauth/{provider.lower()}/callback"
    try:
        auth_url = oauth_service.get_authorization_url(provider, redirect_uri)
        return RedirectResponse(url=auth_url)
    except CredentialsException as err:
        err_msg = quote_plus(str(err))
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error={err_msg}")


from fastapi import Request, Form


@router.api_route(
    "/oauth/{provider}/callback",
    methods=["GET", "POST"],
    summary="Handle social OAuth provider authorization code callback",
)
async def oauth_callback(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Exchanges OAuth code for access token, retrieves user profile, creates/logs in user,
    and redirects browser back to frontend with JWT token.
    """
    params = dict(request.query_params)
    if request.method == "POST":
        try:
            form_data = await request.form()
            params.update({k: str(v) for k, v in form_data.items()})
        except Exception:
            pass

    code = params.get("code")
    id_token = params.get("id_token")
    user_json = params.get("user")
    error = params.get("error")

    if error or (not code and not id_token):
        err_msg = quote_plus(error or f"OAuth sign-in with {provider} was cancelled or failed.")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error={err_msg}")

    redirect_uri = f"http://localhost:8000/api/v1/auth/oauth/{provider.lower()}/callback"

    try:
        user, app_token = await oauth_service.process_oauth_callback(
            provider=provider,
            code=code,
            redirect_uri=redirect_uri,
            db=db,
            id_token=id_token,
            user_json=user_json,
        )

        # Log audit event
        from backend.audit.service import audit_service
        from backend.audit.schemas import AuditLogCreate
        audit_service.log_event(
            db=db,
            event_data=AuditLogCreate(
                event_type="user_oauth_login",
                user_id=user.id,
                user_email=user.email,
                user_role=user.role_id,
                action=f"User '{user.email}' logged in via {provider} OAuth",
            ),
        )

        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?token={app_token}")
    except Exception as err:
        err_msg = quote_plus(str(err))
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error={err_msg}")


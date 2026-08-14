"""
Authentication Routes

API endpoints for user registration, login, and OAuth authentication.
"""

from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend.api.dependencies import get_current_user
from backend.auth.oauth_service import oauth_service
from backend.auth.schemas import (
    InitiateRegistrationRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserAuthInfo,
    VerifyOTPRequest,
)
from backend.auth.service import auth_service
from backend.config import settings
from backend.database.session import get_db
from backend.models.user import User
from backend.utils.exceptions import CredentialsException
from backend.utils.rate_limiter import rate_limit_guard

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/register/initiate",
    status_code=status.HTTP_200_OK,
    summary="Step 1: Send email and mobile OTPs for new user registration",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def initiate_registration(
    request: InitiateRegistrationRequest,
    db: Session = Depends(get_db),
):
    return auth_service.initiate_registration(db, request)


@router.post(
    "/register/verify-otp",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Step 2: Verify email and mobile OTPs",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def verify_otp_and_register(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user, token = auth_service.verify_otp_and_create_user(db, request)

    from backend.audit.schemas import AuditLogCreate
    from backend.audit.service import audit_service

    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="user_registered_otp",
            user_id=user.id,
            user_email=user.email,
            user_role=user.role_id,
            action=f"User '{user.email}' completed OTP registration",
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
    user = auth_service.register_user(db, request)

    from backend.audit.schemas import AuditLogCreate
    from backend.audit.service import audit_service

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
    user, token = auth_service.authenticate_user(db, request)

    from backend.audit.schemas import AuditLogCreate
    from backend.audit.service import audit_service

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
    return UserAuthInfo(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role_id,
        department=current_user.department,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.get(
    "/oauth/{provider}/login",
    summary="Redirect to social OAuth authorization URL",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def oauth_login(provider: str):
    try:
        provider_lower = oauth_service.normalize_provider(provider)
        redirect_uri = oauth_service.build_redirect_uri(provider_lower)
        state = oauth_service.create_state(provider_lower, redirect_uri)
        auth_url = oauth_service.get_authorization_url(
            provider_lower,
            redirect_uri,
            state,
        )

        response = RedirectResponse(url=auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        response.set_cookie(
            key=f"oauth_state_{provider_lower}",
            value=state,
            max_age=settings.OAUTH_STATE_EXPIRE_SECONDS,
            httponly=True,
            secure=settings.OAUTH_SECURE_COOKIES,
            samesite="lax",
            path=f"/api/v1/auth/oauth/{provider_lower}/callback",
        )
        return response

    except CredentialsException:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?oauth_error=configuration",
            status_code=status.HTTP_303_SEE_OTHER,
        )


@router.get(
    "/oauth/{provider}/callback",
    summary="Handle social OAuth provider authorization code callback",
)
async def oauth_callback(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        provider_lower = oauth_service.normalize_provider(provider)
        redirect_uri = oauth_service.build_redirect_uri(provider_lower)

        state = request.query_params.get("state")
        stored_state = request.cookies.get(f"oauth_state_{provider_lower}")

        if not state or not stored_state:
            raise CredentialsException("OAuth state is missing.")

        if not secrets.compare_digest(state, stored_state):
            raise CredentialsException("Invalid OAuth state.")

        oauth_service.verify_state(
            state,
            provider_lower,
            redirect_uri,
        )

        error = request.query_params.get("error")
        code = request.query_params.get("code")

        if error or not code:
            raise CredentialsException("OAuth authentication was cancelled or failed.")

        user, app_token = await oauth_service.process_oauth_callback(
            provider=provider_lower,
            code=code,
            redirect_uri=redirect_uri,
            db=db,
        )

        from backend.audit.schemas import AuditLogCreate
        from backend.audit.service import audit_service

        audit_service.log_event(
            db=db,
            event_data=AuditLogCreate(
                event_type="user_oauth_login",
                user_id=user.id,
                user_email=user.email,
                user_role=user.role_id,
                action=f"User '{user.email}' logged in via {provider_lower} OAuth",
            ),
        )

        response = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?token={quote_plus(app_token)}",
            status_code=status.HTTP_303_SEE_OTHER,
        )
        response.delete_cookie(
            key=f"oauth_state_{provider_lower}",
            path=f"/api/v1/auth/oauth/{provider_lower}/callback",
        )
        return response

    except CredentialsException:
        response = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?oauth_error=authentication_failed",
            status_code=status.HTTP_303_SEE_OTHER,
        )
        try:
            provider_lower = oauth_service.normalize_provider(provider)
            response.delete_cookie(
                key=f"oauth_state_{provider_lower}",
                path=f"/api/v1/auth/oauth/{provider_lower}/callback",
            )
        except CredentialsException:
            pass
        return response
    except Exception:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?oauth_error=authentication_failed",
            status_code=status.HTTP_303_SEE_OTHER,
        )

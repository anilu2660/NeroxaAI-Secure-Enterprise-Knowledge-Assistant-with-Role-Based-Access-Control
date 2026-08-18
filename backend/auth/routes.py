"""
Authentication Routes

API endpoints for user registration, login, and OAuth authentication.
"""

import secrets

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend.api.dependencies import get_current_user
from backend.auth.oauth_service import oauth_service
from backend.auth.schemas import (
    InitiateRegistrationRequest,
    LoginRequest,
    RegisterRequest,
    SendPhoneOTPRequest,
    TokenResponse,
    UserAuthInfo,
    VerifyOTPRequest,
    VerifyPhoneOTPRequest,
)
from backend.auth.service import auth_service
from backend.config import settings
from backend.database.session import get_db
from backend.models.user import User
from backend.utils.exceptions import CredentialsException
from backend.utils.rate_limiter import rate_limit_guard

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def _set_access_token_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="neroxa_access_token",
        value=token,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def _clear_access_token_cookie(response: Response) -> None:
    response.delete_cookie(key="neroxa_access_token", path="/")


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
    response: Response,
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
    _set_access_token_cookie(response, token)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role_id,
        department=user.department,
    )


@router.post(
    "/phone/send-otp",
    summary="Send SMS OTP to verify authenticated user's mobile number and onboarding preferences",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def send_phone_otp(
    request: SendPhoneOTPRequest,
    current_user: User = Depends(get_current_user),
):
    return auth_service.send_phone_verification_otp(
        current_user,
        request.phone_number,
        department=request.department,
        requested_role=request.requested_role,
    )


@router.post(
    "/phone/verify-otp",
    response_model=UserAuthInfo,
    summary="Verify SMS OTP and complete user onboarding",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def verify_phone_otp(
    request: VerifyPhoneOTPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_user = auth_service.verify_phone_otp(
        db,
        current_user,
        request.phone_number,
        request.otp,
    )
    return UserAuthInfo(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=updated_user.role_id,
        department=updated_user.department,
        phone_number=updated_user.phone_number,
        is_active=updated_user.is_active,
        is_approved=updated_user.is_approved,
        requested_role=updated_user.requested_role_id,
        created_at=updated_user.created_at,
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
        is_approved=user.is_approved,
        requested_role=user.requested_role_id,
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
    response: Response,
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
    _set_access_token_cookie(response, token)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role_id,
        department=user.department,
        is_approved=user.is_approved,
        requested_role=user.requested_role_id,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear authenticated browser session",
)
def logout(response: Response):
    _clear_access_token_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/me",
    response_model=UserAuthInfo,
    summary="Get current authenticated user",
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserAuthInfo(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role_id,
        department=current_user.department,
        is_active=current_user.is_active,
        is_approved=current_user.is_approved,
        requested_role=current_user.requested_role_id,
        created_at=current_user.created_at,
    )


@router.get(
    "/oauth/{provider}/login",
    summary="Redirect to social OAuth authorization URL",
    dependencies=[Depends(rate_limit_guard("auth"))],
)
def oauth_login(provider: str, request: Request):
    try:
        provider_lower = oauth_service.normalize_provider(provider)
        redirect_uri = oauth_service.build_redirect_uri(provider_lower)

        referer = request.headers.get("referer") or request.headers.get("origin")
        frontend_url = settings.FRONTEND_URL
        if referer:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                frontend_url = f"{parsed.scheme}://{parsed.netloc}"

        state = oauth_service.create_state(provider_lower, redirect_uri, frontend_url=frontend_url)
        auth_url = oauth_service.get_authorization_url(
            provider_lower,
            redirect_uri,
            state,
        )
        response = RedirectResponse(
            url=auth_url,
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )
        # Store state in a cookie as an extra CSRF hint (best-effort).
        # Validation relies on HMAC signature in verify_state(); the cookie
        # is supplementary and not required for the check to pass.
        response.set_cookie(
            key=f"oauth_state_{provider_lower}",
            value=state,
            max_age=settings.OAUTH_STATE_EXPIRE_SECONDS,
            httponly=True,
            secure=settings.OAUTH_SECURE_COOKIES,
            samesite="lax",
            path="/api/v1/auth/",
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
    target_frontend_url = settings.FRONTEND_URL
    try:
        provider_lower = oauth_service.normalize_provider(provider)
        redirect_uri = oauth_service.build_redirect_uri(provider_lower)
        state = request.query_params.get("state")

        if not state:
            raise CredentialsException("OAuth state parameter is missing.")

        # Primary validation: HMAC signature + timestamp + nonce (cryptographically secure).
        state_payload = oauth_service.verify_state(state, provider_lower, redirect_uri)
        if state_payload.get("frontend_url"):
            target_frontend_url = state_payload["frontend_url"].rstrip("/")

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

        from urllib.parse import quote
        response = RedirectResponse(
            url=f"{target_frontend_url}/login?token={quote(app_token, safe='')}",
            status_code=status.HTTP_303_SEE_OTHER,
        )
        _set_access_token_cookie(response, app_token)
        response.delete_cookie(
            key=f"oauth_state_{provider_lower}",
            path=f"/api/v1/auth/oauth/{provider_lower}/callback",
        )
        return response

    except CredentialsException:
        response = RedirectResponse(
            url=f"{target_frontend_url}/login?oauth_error=authentication_failed",
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
            url=f"{target_frontend_url}/login?oauth_error=authentication_failed",
            status_code=status.HTTP_303_SEE_OTHER,
        )

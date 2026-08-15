"""
API Dependencies

Shared FastAPI dependencies for authentication, DB sessions, and current user retrieval.
"""

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.auth.jwt_handler import decode_access_token
from backend.database.session import get_db
from backend.models.user import User
from backend.users.service import user_service
from backend.utils.exceptions import CredentialsException


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def _get_token_from_request(
    request: Request,
    bearer_token: str | None,
    cookie_token: str | None,
) -> str | None:
    if bearer_token:
        return bearer_token
    if cookie_token:
        return cookie_token
    query_token = request.query_params.get("token")
    if query_token:
        return query_token
    return request.cookies.get("neroxa_access_token")


def _resolve_user(db: Session, token: str | None) -> User:
    if not token:
        raise CredentialsException("Authentication token missing.")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise CredentialsException("Invalid token payload.")
    except Exception as exc:
        raise CredentialsException("Could not validate credentials.") from exc

    try:
        user = user_service.get_by_id(db, user_id)
    except Exception as exc:
        raise CredentialsException("User account not found.") from exc

    if not user:
        raise CredentialsException("User account not found.")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )

    return user


def get_current_user(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    cookie_token: str | None = Cookie(default=None, alias="neroxa_access_token"),
    db: Session = Depends(get_db),
) -> User:
    token = _get_token_from_request(request, bearer_token, cookie_token)
    return _resolve_user(db, token)


def get_current_user_optional(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    cookie_token: str | None = Cookie(default=None, alias="neroxa_access_token"),
    db: Session = Depends(get_db),
) -> User | None:
    token = _get_token_from_request(request, bearer_token, cookie_token)
    if not token:
        return None

    try:
        return _resolve_user(db, token)
    except Exception:
        return None

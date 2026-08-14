"""
API Dependencies

Shared FastAPI dependencies for authentication, DB sessions, and current user retrieval.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.auth.jwt_handler import decode_access_token
from backend.users.service import user_service
from backend.models.user import User
from backend.utils.exceptions import CredentialsException

# OAuth2 scheme for JWT bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that decodes JWT bearer token and returns the current authenticated User model.
    """
    if not token:
        raise CredentialsException("Authentication token missing.")

    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise CredentialsException("Invalid token payload.")
    except Exception as e:
        raise CredentialsException("Could not validate credentials.") from e

    try:
        user = user_service.get_by_id(db, user_id)
    except Exception as e:
        raise CredentialsException("User account not found.") from e

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )

    return user


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        user = user_service.get_by_id(db, user_id)

        if not user or not user.is_active:
            return None

        return user
    except Exception:
        return None

 

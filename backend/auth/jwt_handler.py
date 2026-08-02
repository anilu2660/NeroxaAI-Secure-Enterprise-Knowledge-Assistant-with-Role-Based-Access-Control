"""
JWT Token Handler

Encodes and decodes JWT access tokens with role & department claims.
"""

import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt
from backend.config import settings

logger = logging.getLogger(__name__)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Dict of claims (sub = user_id, email, role, department).
        expires_delta: Optional custom expiration timedelta.

    Returns:
        Encoded JWT token string.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Args:
        token: Encoded JWT string.

    Returns:
        Payload dictionary containing claims.

    Raises:
        JWTError if validation fails.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as e:
        logger.warning("Invalid or expired JWT token: %s", str(e))
        raise

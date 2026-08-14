import logging
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from backend.config import settings

logger = logging.getLogger(__name__)


REQUIRED_CLAIMS = {
    "sub",
    "exp",
    "iat",
    "jti",
}


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:

    if not data:
        raise ValueError("JWT payload cannot be empty.")

    if "sub" not in data or not data["sub"]:
        raise ValueError("JWT subject (sub) is required.")

    now = datetime.now(timezone.utc)

    if expires_delta is not None:
        expire = now + expires_delta
    else:
        expire = now + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = data.copy()

    to_encode.update(
        {
            "iat": now,
            "exp": expire,
            "jti": str(uuid.uuid4()),
        }
    )

    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

        return encoded_jwt

    except Exception as exc:

        logger.exception(
            "Failed to create JWT."
        )

        raise RuntimeError(
            "Failed to create authentication token."
        ) from exc


def decode_access_token(token: str) -> dict:

    if not token:
        raise JWTError("Missing authentication token.")

    try:

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "require_exp": True,
                "require_iat": True,
                "require_sub": True,
            },
        )

        missing_claims = REQUIRED_CLAIMS - payload.keys()

        if missing_claims:
            raise JWTError(
                f"Missing required JWT claims: {missing_claims}"
            )

        subject = payload.get("sub")

        if not isinstance(subject, str) or not subject.strip():
            raise JWTError(
                "Invalid JWT subject."
            )

        return payload

    except JWTError:

        logger.warning(
            "JWT validation failed."
        )

        raise

    except Exception as exc:

        logger.exception(
            "Unexpected JWT validation error."
        )

        raise JWTError(
            "Invalid authentication token."
        ) from exc

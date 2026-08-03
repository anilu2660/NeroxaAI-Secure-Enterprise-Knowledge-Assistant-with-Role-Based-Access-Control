"""
Password Hashing Utility

Provides password hashing and verification using passlib + bcrypt.
"""

from passlib.context import CryptContext

# Configure password context using bcrypt scheme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt (truncating to 72 bytes for safety).
    """
    safe_password = password[:72]
    return pwd_context.hash(safe_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a stored bcrypt hash.
    """
    safe_password = plain_password[:72]
    return pwd_context.verify(safe_password, hashed_password)


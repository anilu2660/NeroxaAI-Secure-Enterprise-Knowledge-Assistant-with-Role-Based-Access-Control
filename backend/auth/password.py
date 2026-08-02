"""
Password Hashing Utility

Provides password hashing and verification using passlib + bcrypt.
"""

from passlib.context import CryptContext

# Configure password context using bcrypt scheme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a stored bcrypt hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

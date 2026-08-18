"""
Password Hashing Utility

Provides robust password hashing and verification using standard native bcrypt.
"""

import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a plain text password using standard bcrypt.
    Truncates to 72 bytes (standard bcrypt max length) safely in UTF-8 bytes.
    """
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a stored bcrypt hash.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


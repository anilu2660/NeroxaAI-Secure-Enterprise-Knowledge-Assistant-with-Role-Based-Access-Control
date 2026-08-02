"""
Authentication Module

Handles JWT authentication, token decoding, and password hashing.
"""

from backend.auth.service import AuthService, auth_service
from backend.auth.password import hash_password, verify_password
from backend.auth.jwt_handler import create_access_token, decode_access_token
from backend.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserAuthInfo

__all__ = [
    "AuthService",
    "auth_service",
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserAuthInfo",
]

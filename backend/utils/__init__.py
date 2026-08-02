"""
Utilities Module

Provides structured logging and custom exception handlers.
"""

from backend.utils.logger import logger, setup_logger
from backend.utils.rate_limiter import rate_limit_guard
from backend.utils.exceptions import (
    CredentialsException,
    PermissionDeniedException,
    ResourceNotFoundException,
    DuplicateResourceException,
)

__all__ = [
    "logger",
    "setup_logger",
    "rate_limit_guard",
    "CredentialsException",
    "PermissionDeniedException",
    "ResourceNotFoundException",
    "DuplicateResourceException",
]

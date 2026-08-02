"""
Custom Exceptions & Global Exception Handlers

Defines domain-specific custom HTTP exceptions.
"""

from fastapi import HTTPException, status


class CredentialsException(HTTPException):
    """Exception raised when authentication fails."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedException(HTTPException):
    """Exception raised when RBAC permission check fails."""

    def __init__(self, detail: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class ResourceNotFoundException(HTTPException):
    """Exception raised when requested resource is not found."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class DuplicateResourceException(HTTPException):
    """Exception raised when attempting to create a duplicate resource."""

    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

"""
API Module

Aggregates domain routers and shared API dependencies.
"""

from backend.api.routes import api_router
from backend.api.dependencies import get_current_user, oauth2_scheme

__all__ = [
    "api_router",
    "get_current_user",
    "oauth2_scheme",
]

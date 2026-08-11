"""
Master API Router

Aggregates all domain routes (auth, users, roles, documents, rag, audit)
into a unified API router with version prefix /api/v1.
"""

from fastapi import APIRouter
from backend.auth.routes import router as auth_router
from backend.users.routes import router as user_router
from backend.roles.routes import router as role_router
from backend.documents.routes import router as document_router
from backend.rag.routes import router as rag_router
from backend.audit.routes import router as audit_router
from backend.chat.routes import router as chat_router
from backend.feedback.routes import router as feedback_router

# Master API Router
api_router = APIRouter()

# Include feature routers
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(role_router)
api_router.include_router(document_router)
api_router.include_router(rag_router)
api_router.include_router(audit_router)
api_router.include_router(chat_router)
api_router.include_router(feedback_router)


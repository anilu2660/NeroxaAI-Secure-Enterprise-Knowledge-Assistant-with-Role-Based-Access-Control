import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend' module is always found regardless of CWD
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database.session import init_db
from backend.api.routes import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifespan handler.
    Initializes database tables, seeds roles/admin, and verifies vector DB collection.
    """
    logger.info("Starting Enterprise RAG Application...")
    init_db()

    # Verify / Warmup Qdrant Vector Collection
    try:
        from backend.retriever.qdrant_client import qdrant_manager
        qdrant_manager.ensure_collection_exists()
        logger.info("Qdrant Vector Database collection verified.")
    except Exception as e:
        logger.warning("Could not connect to Qdrant on startup (will retry on query): %s", str(e))

    yield
    logger.info("Shutting down Enterprise RAG Application...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Secure Enterprise Knowledge Assistant with Role-Based Access Control",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    # SECURITY: Disable interactive API docs in production to prevent surface exposure.
    # Docs are only available when DEBUG=true (local dev).
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Configure CORS
# SECURITY: Explicitly scope allowed methods and headers.
# Wildcards with allow_credentials=True is a CORS misconfiguration.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Mount master API router
app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — API entry point."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Application health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }

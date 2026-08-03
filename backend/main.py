"""
Enterprise RAG Application - Main Entry Point

Production-style Enterprise Retrieval-Augmented Generation (RAG) platform
with Role-Based Access Control (RBAC).
"""

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
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

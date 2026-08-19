import sys
import os
from pathlib import Path

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

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

    # Verify / Warmup Qdrant Vector Collection & Synchronize with Postgres
    try:
        from backend.retriever.qdrant_client import qdrant_manager
        qdrant_manager.ensure_collection_exists()
        logger.info("Qdrant Vector Database collection verified.")

        from backend.database.session import SessionLocal
        from backend.documents.service import document_service
        with SessionLocal() as db:
            await document_service.sync_vector_store(db)
        logger.info("Startup vector store sync complete.")
    except Exception as e:
        logger.warning("Could not connect to Qdrant or sync on startup: %s", str(e))

    yield
    logger.info("Shutting down Enterprise RAG Application...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Secure Enterprise Knowledge Assistant with Role-Based Access Control",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

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

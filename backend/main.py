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
from sqlalchemy import text
from backend.config import settings
from backend.database.session import init_db, engine
from backend.api.routes import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Enterprise RAG Application...")
    init_db()

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
        logger.exception("Could not connect to Qdrant or sync on startup: %s", str(e))

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
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
        "dependencies": "/health/dependencies",
        "llm_health": "/health/llm",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/health/dependencies", tags=["Health"])
def dependency_health_check():
    """Verify PostgreSQL and Qdrant from the running backend."""
    result = {
        "postgres": {"status": "unhealthy", "error": None},
        "qdrant": {
            "status": "unhealthy",
            "collection": settings.QDRANT_COLLECTION,
            "collection_exists": False,
            "error": None,
        },
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        result["postgres"]["status"] = "healthy"
    except Exception as exc:
        result["postgres"]["error"] = str(exc)

    try:
        from backend.retriever.qdrant_client import qdrant_manager
        collections = qdrant_manager.client.get_collections()
        names = [item.name for item in collections.collections]
        result["qdrant"]["status"] = "healthy"
        result["qdrant"]["collection_exists"] = settings.QDRANT_COLLECTION in names
    except Exception as exc:
        result["qdrant"]["error"] = str(exc)

    result["status"] = (
        "healthy"
        if result["postgres"]["status"] == "healthy"
        and result["qdrant"]["status"] == "healthy"
        else "degraded"
    )
    return result


@app.get("/health/llm", tags=["Health"])
def llm_health_check():
    """Check Ollama connectivity without exposing the API key."""
    from backend.llm.service import llm_service

    result = llm_service.check_health()
    return {
        "status": result.get("status"),
        "provider": result.get("provider"),
        "target_model": result.get("target_model"),
        "model_available": result.get("model_available"),
        "error": result.get("error"),
    }

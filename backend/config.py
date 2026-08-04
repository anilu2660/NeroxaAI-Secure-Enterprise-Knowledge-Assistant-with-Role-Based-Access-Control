"""
Backend configuration settings.

Loads environment variables and provides application-wide configuration.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the same directory as this file, regardless of CWD
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)


class Settings:
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Enterprise RAG"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/enterprise_rag"
    )

    # Qdrant Vector Database (Supports local & Qdrant Cloud)
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_URL: str | None = os.getenv("QDRANT_URL", None)
    QDRANT_API_KEY: str | None = os.getenv("QDRANT_API_KEY", None)
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "enterprise_docs")

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-key")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # Ollama LLM
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # Embeddings
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"
    )
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))

    # Document Processing
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000"
    ).split(",")


settings = Settings()
# Trigger reload 2

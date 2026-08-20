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

from dotenv import load_dotenv

# Never let a local .env override Railway/Vercel deployment variables.
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)


def _normalize_ollama_base_url(value: str) -> str:
    url = (value or "").strip().rstrip("/")
    if url == "https://api.ollama.com":
        return "https://ollama.com"
    if url.endswith("/api"):
        return url[:-4].rstrip("/")
    return url


def _normalize_origin(value: str) -> str:
    return (value or "").strip().rstrip("/")


class Settings:
    APP_NAME: str = "Enterprise RAG"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/enterprise_rag")

    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_URL: str | None = os.getenv("QDRANT_URL", "").strip() or None
    QDRANT_API_KEY: str | None = os.getenv("QDRANT_API_KEY", "").strip() or None
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "enterprise_docs")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY environment variable is required.")
    if len(JWT_SECRET_KEY) < 32:
        raise RuntimeError("JWT_SECRET_KEY must contain at least 32 characters.")
    if JWT_ALGORITHM not in {"HS256", "HS384", "HS512"}:
        raise RuntimeError("Unsupported JWT_ALGORITHM. Use HS256, HS384, or HS512.")
    if JWT_ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
        raise RuntimeError("JWT_ACCESS_TOKEN_EXPIRE_MINUTES must be greater than 0.")

    FRONTEND_URL: str = _normalize_origin(os.getenv("FRONTEND_URL", "http://localhost:5173"))
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
    OAUTH_STATE_EXPIRE_SECONDS: int = int(os.getenv("OAUTH_STATE_EXPIRE_SECONDS", "600"))
    OAUTH_SECURE_COOKIES: bool = os.getenv("OAUTH_SECURE_COOKIES", "false" if DEBUG else "true").lower() == "true"
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false" if DEBUG else "true").lower() == "true"

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    MICROSOFT_CLIENT_ID: str = os.getenv("MICROSOFT_CLIENT_ID", "")
    MICROSOFT_TENANT_ID: str = os.getenv("MICROSOFT_TENANT_ID", "common")

    SERPAPI_KEY: str = os.getenv("SERPAPI_KEY", "")
    SERPAPI_BASE_URL: str = os.getenv("SERPAPI_BASE_URL", "https://serpapi.com/search.json")
    WEB_SEARCH_MAX_RESULTS: int = int(os.getenv("WEB_SEARCH_MAX_RESULTS", "5"))
    WEB_SEARCH_TIMEOUT_SECONDS: float = float(os.getenv("WEB_SEARCH_TIMEOUT_SECONDS", "10"))
    WEB_SEARCH_LOCATION: str = os.getenv("WEB_SEARCH_LOCATION", "Mumbai, Maharashtra, India")
    WEB_SEARCH_LANGUAGE: str = os.getenv("WEB_SEARCH_LANGUAGE", "en")
    WEB_SEARCH_COUNTRY: str = os.getenv("WEB_SEARCH_COUNTRY", "in")

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_CONNECT_TIMEOUT_SECONDS: float = float(os.getenv("REDIS_CONNECT_TIMEOUT_SECONDS", "2"))
    REDIS_TIMEOUT_SECONDS: float = float(os.getenv("REDIS_TIMEOUT_SECONDS", "2"))
    CACHE_NAMESPACE: str = os.getenv("CACHE_NAMESPACE", "neroxaai:v2")
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))
    CACHE_MAX_ENTRIES_PER_SCOPE: int = int(os.getenv("CACHE_MAX_ENTRIES_PER_SCOPE", "50"))

    RETRIEVAL_PIPELINE_VERSION: str = os.getenv("RETRIEVAL_PIPELINE_VERSION", "4")

    OLLAMA_BASE_URL: str = _normalize_ollama_base_url(os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5")
    OLLAMA_NUM_GPU: int | None = int(os.getenv("OLLAMA_NUM_GPU")) if os.getenv("OLLAMA_NUM_GPU") else None
    OLLAMA_NUM_CTX: int = int(os.getenv("OLLAMA_NUM_CTX", "2048"))
    OLLAMA_API_KEY: str | None = os.getenv("OLLAMA_API_KEY", "").strip() or None

    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    RERANKER_MODEL: str = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
    RERANKER_TOP_N: int = int(os.getenv("RERANKER_TOP_N", "5"))
    RERANKER_MIN_SCORE: float = float(os.getenv("RERANKER_MIN_SCORE", "0.0"))
    RERANKER_ENABLE_THRESHOLD: bool = os.getenv("RERANKER_ENABLE_THRESHOLD", "false").lower() == "true"
    ENABLE_HYBRID_SEARCH: bool = os.getenv("ENABLE_HYBRID_SEARCH", "true").lower() == "true"

    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1200"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

    _cors_raw = os.getenv("CORS_ORIGINS", "").strip()
    CORS_ORIGINS: list[str] = (
        list(dict.fromkeys(_normalize_origin(origin) for origin in _cors_raw.split(",") if _normalize_origin(origin)))
        if _cors_raw
        else list(dict.fromkeys([FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]))
    )

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply.neroxaai@gmail.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "NeroxaAI Security")

    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "console")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    TWILIO_VERIFY_SERVICE_SID: str = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")


settings = Settings()

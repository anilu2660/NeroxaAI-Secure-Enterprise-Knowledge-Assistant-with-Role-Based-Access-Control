"""
Embedding Service

Generates vector embeddings for document chunks and user queries
using Sentence Transformers (BAAI/bge-small-en-v1.5).
"""

import logging
from sentence_transformers import SentenceTransformer
from backend.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating text embeddings using Sentence Transformers.

    Loads the configured model once and provides methods to embed
    individual queries and batches of document chunks.
    """

    def __init__(self):
        """Initialize the embedding model."""
        self.model_name = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
        self._model = None

    @property
    def model(self) -> SentenceTransformer:
        """Lazy-load the embedding model on first use."""
        if self._model is None:
            logger.info("Loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded successfully")
        return self._model

    def embed_query(self, query: str) -> list[float]:
        """
        Generate an embedding vector for a single query string.

        Args:
            query: The text to embed.

        Returns:
            List of floats representing the embedding vector.
        """
        try:
            embedding = self.model.encode(query, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error("Failed to embed query: %s", str(e))
            raise RuntimeError(f"Embedding generation failed: {str(e)}") from e

    def embed_documents(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        """
        Generate embedding vectors for a batch of document chunks.

        Args:
            texts: List of text chunks to embed.
            batch_size: Number of texts to process at once.

        Returns:
            List of embedding vectors (each is a list of floats).
        """
        try:
            logger.info("Embedding %d document chunks (batch_size=%d)", len(texts), batch_size)
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                normalize_embeddings=True,
                show_progress_bar=True,
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error("Failed to embed documents: %s", str(e))
            raise RuntimeError(f"Batch embedding failed: {str(e)}") from e

    def check_health(self) -> dict:
        """
        Check if the embedding model is loaded and functional.

        Returns:
            dict with status and model information.
        """
        try:
            # Attempt a test embedding
            test_embedding = self.embed_query("health check")
            return {
                "status": "healthy",
                "model": self.model_name,
                "dimension": len(test_embedding),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "model": self.model_name,
                "error": str(e),
            }


# Singleton instance for dependency injection
embedding_service = EmbeddingService()

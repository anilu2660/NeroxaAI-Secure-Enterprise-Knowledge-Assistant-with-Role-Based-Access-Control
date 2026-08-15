"""
Cross-Encoder Reranker

Reranks retrieved document chunks using a cross-encoder model for
higher precision relevance scoring than bi-encoder cosine similarity alone.

Pipeline position: retrieve (hybrid) → rerank → generate

Why rerank?
  Bi-encoders (dense/sparse) trade precision for speed.
  Cross-encoders jointly encode query+document and are significantly more accurate
  at relevance scoring, but too slow to run on the full corpus — perfect for reranking
  the top-K candidates from the hybrid retriever.
"""

import logging
import asyncio
from sentence_transformers import CrossEncoder
from backend.config import settings

logger = logging.getLogger(__name__)


class CrossEncoderReranker:
    """
    Reranks document chunks using a cross-encoder relevance model.

    The cross-encoder takes (query, document) pairs and outputs a relevance score
    for each. Chunks are sorted by this score and only top-N are returned to the LLM.

    Model default: cross-encoder/ms-marco-MiniLM-L-6-v2
      - Size: ~22MB
      - Speed: ~200 pairs/sec on CPU
      - Quality: Strong for English enterprise content
    """

    def __init__(self):
        self.model_name = settings.RERANKER_MODEL
        self.top_n = settings.RERANKER_TOP_N
        self._model: CrossEncoder | None = None

    @property
    def model(self) -> CrossEncoder:
        """Lazy-load cross-encoder on first use to avoid startup delay."""
        if self._model is None:
            logger.info("Loading cross-encoder reranker: %s", self.model_name)
            self._model = CrossEncoder(self.model_name, max_length=512)
            logger.info("Reranker loaded successfully")
        return self._model

    def rerank(self, query: str, chunks: list[dict]) -> list[dict]:
        """
        Rerank retrieved chunks by cross-encoder relevance score.

        Args:
            query: The user's question.
            chunks: Retrieved chunks from hybrid search (each has 'content', 'title', etc.)

        Returns:
            Top-N reranked chunks with 'reranker_score' added, sorted by relevance desc.
        """
        if not chunks:
            return chunks
        if len(chunks) == 1:
            return chunks

        pairs = [(query, chunk.get("content", "")[:512]) for chunk in chunks]

        try:
            scores = self.model.predict(pairs, show_progress_bar=False)

            # Zip scores with chunks and sort by score descending
            scored = sorted(zip(scores.tolist(), chunks), key=lambda x: x[0], reverse=True)

            seen_reranked = set()
            reranked = []
            for score, chunk in scored:
                key = f"{chunk.get('document_id')}:{chunk.get('page_number')}"
                if key not in seen_reranked:
                    seen_reranked.add(key)
                    enriched = dict(chunk)
                    enriched["reranker_score"] = round(float(score), 4)
                    reranked.append(enriched)
                if len(reranked) >= self.top_n:
                    break

            logger.info(
                "Reranked %d → %d chunks | best=%.4f",
                len(chunks),
                len(reranked),
                scored[0][0] if scored else 0.0,
            )
            return reranked

        except Exception as e:
            logger.warning("Reranking failed, returning original order: %s", str(e))
            return chunks[: self.top_n]

    async def async_rerank(self, query: str, chunks: list[dict]) -> list[dict]:
        """Async wrapper — runs CPU-bound reranking in a threadpool."""
        return await asyncio.to_thread(self.rerank, query, chunks)

    def check_health(self) -> dict:
        """Verify the reranker model is loadable."""
        try:
            _ = self.model  # triggers lazy load
            return {"status": "healthy", "model": self.model_name, "top_n": self.top_n}
        except Exception as e:
            return {"status": "unhealthy", "model": self.model_name, "error": str(e)}


# Singleton
reranker_service = CrossEncoderReranker()

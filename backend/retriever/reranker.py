"""
Cross-Encoder Reranker

Reranks retrieved chunks using a cross-encoder model for higher precision.
The reranker receives the actual retrieval chunk, not an entire parent page.
Parent-section expansion is handled after ranking by the RAG service.
"""

import asyncio
import logging

from sentence_transformers import CrossEncoder
from backend.config import settings

logger = logging.getLogger(__name__)


class CrossEncoderReranker:
    def __init__(self):
        self.model_name = settings.RERANKER_MODEL
        self.top_n = settings.RERANKER_TOP_N
        self._model: CrossEncoder | None = None

    @property
    def model(self) -> CrossEncoder:
        if self._model is None:
            logger.info("Loading cross-encoder reranker: %s", self.model_name)
            self._model = CrossEncoder(self.model_name, max_length=512)
            logger.info("Reranker loaded successfully")
        return self._model

    @staticmethod
    def _rerank_text(chunk: dict) -> str:
        """Use the precise chunk text for scoring; fall back safely for legacy points."""
        return (
            chunk.get("raw_text")
            or chunk.get("content")
            or chunk.get("parent_content")
            or ""
        ).strip()

    @staticmethod
    def _chunk_identity(chunk: dict) -> str:
        """Keep distinct chunks from the same page; dedupe only the same chunk."""
        return ":".join(
            str(chunk.get(key, ""))
            for key in ("document_id", "page_number", "parent_id", "chunk_index")
        )

    def rerank(self, query: str, chunks: list[dict]) -> list[dict]:
        if not chunks:
            return chunks
        if len(chunks) == 1:
            result = dict(chunks[0])
            result["reranker_score"] = None
            return [result]

        pairs = [(query, self._rerank_text(chunk)[:1800]) for chunk in chunks]

        try:
            scores = self.model.predict(pairs, show_progress_bar=False)
            score_values = scores.tolist() if hasattr(scores, "tolist") else list(scores)
            scored = sorted(
                zip(score_values, chunks),
                key=lambda x: float(x[0]),
                reverse=True,
            )

            seen_reranked = set()
            reranked = []
            for score, chunk in scored:
                key = self._chunk_identity(chunk)
                if key in seen_reranked:
                    continue
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
                float(scored[0][0]) if scored else 0.0,
            )
            return reranked

        except Exception as e:
            logger.warning("Reranking failed, returning original order: %s", str(e))
            return chunks[: self.top_n]

    async def async_rerank(self, query: str, chunks: list[dict]) -> list[dict]:
        return await asyncio.to_thread(self.rerank, query, chunks)

    def check_health(self) -> dict:
        try:
            _ = self.model
            return {"status": "healthy", "model": self.model_name, "top_n": self.top_n}
        except Exception as e:
            return {"status": "unhealthy", "model": self.model_name, "error": str(e)}


reranker_service = CrossEncoderReranker()

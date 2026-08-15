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
        """Use the precise retrieval chunk for scoring; fall back safely for legacy points."""
        return (
            chunk.get("raw_text")
            or chunk.get("content")
            or chunk.get("parent_content")
            or ""
        ).strip()

    @staticmethod
    def _chunk_identity(chunk: dict) -> str:
        """
        Identify the exact retrieval unit.

        Distinct chunks from the same page/section must remain eligible for the
        final ranking. If chunk metadata is unavailable on a legacy result,
        use the Qdrant point id rather than collapsing unrelated chunks into
        the same empty metadata key.
        """
        point_id = str(chunk.get("point_id") or "").strip()
        chunk_index = chunk.get("chunk_index", -1)

        if point_id:
            return f"point:{point_id}"

        if chunk_index not in (None, -1, "", "N/A"):
            return ":".join(
                str(chunk.get(key, ""))
                for key in ("document_id", "page_number", "parent_id", "chunk_index")
            )

        return f"legacy:{id(chunk)}"

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
            filtered_count = 0
            min_score = settings.RERANKER_MIN_SCORE
            threshold_enabled = settings.RERANKER_ENABLE_THRESHOLD

            for score, chunk in scored:
                score_float = float(score)
                if threshold_enabled and score_float < min_score:
                    filtered_count += 1
                    continue

                key = self._chunk_identity(chunk)
                if key in seen_reranked:
                    continue
                seen_reranked.add(key)

                enriched = dict(chunk)
                enriched["reranker_score"] = round(score_float, 4)
                reranked.append(enriched)

                if len(reranked) >= self.top_n:
                    break

            logger.info(
                "Reranked %d → %d chunks | filtered=%d | threshold=%s %.4f | best=%.4f",
                len(chunks),
                len(reranked),
                filtered_count,
                threshold_enabled,
                min_score,
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
            return {
                "status": "healthy",
                "model": self.model_name,
                "top_n": self.top_n,
                "threshold_enabled": settings.RERANKER_ENABLE_THRESHOLD,
                "min_score": settings.RERANKER_MIN_SCORE,
            }
        except Exception as e:
            return {"status": "unhealthy", "model": self.model_name, "error": str(e)}


reranker_service = CrossEncoderReranker()

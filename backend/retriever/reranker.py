"""
Cross-Encoder Reranker

Reranks retrieved chunks using a cross-encoder model for higher precision.
The reranker receives the actual retrieval chunk, not an entire parent page.
Parent-section expansion is handled after ranking by the RAG service.
"""

import asyncio
import logging

import torch
from sentence_transformers import CrossEncoder
from backend.config import settings

logger = logging.getLogger(__name__)


class CrossEncoderReranker:
    def __init__(self):
        self.model_name = settings.RERANKER_MODEL
        self.top_n = settings.RERANKER_TOP_N
        self._model: CrossEncoder | None = None
        # Auto-detect GPU; fall back to CPU if CUDA is unavailable.
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Reranker will use device: %s", self.device)

    @property
    def model(self) -> CrossEncoder:
        if self._model is None:
            logger.info("Loading cross-encoder reranker: %s on device: %s", self.model_name, self.device)
            self._model = CrossEncoder(self.model_name, max_length=512, device=self.device)
            logger.info("Reranker loaded successfully on %s", self.device)
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

    @staticmethod
    def _extract_query_entities(query: str) -> list[str]:
        """Extract capitalized multi-word phrases and alphanumeric entities from query."""
        import re
        proper_nouns = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", query)
        exact_terms = re.findall(r"\b(?:[A-Z]{2,}|[A-Za-z0-9_\-]{3,})\b", query)
        stop = {"WHAT", "THE", "OUR", "ARE", "AND", "FOR", "HOW", "CAN", "YOU", "TELL", "ABOUT", "POLICY", "COMPANY"}
        filtered = [t for t in set(proper_nouns + exact_terms) if t.upper() not in stop and len(t) >= 3]
        return filtered

    def rerank(
        self,
        query: str,
        chunks: list[dict],
        top_n: int | None = None,
    ) -> list[dict]:
        limit = top_n if top_n is not None else self.top_n
        if limit <= 0 or not chunks:
            return []

        if len(chunks) == 1:
            result = dict(chunks[0])
            result["reranker_score"] = None
            return [result]

        pairs = [(query, self._rerank_text(chunk)[:1800]) for chunk in chunks]
        query_entities = self._extract_query_entities(query)

        try:
            scores = self.model.predict(pairs, show_progress_bar=False)
            score_values = scores.tolist() if hasattr(scores, "tolist") else list(scores)

            # Apply entity-aware boost/penalty
            adjusted_scores = []
            for score, chunk in zip(score_values, chunks):
                score_float = float(score)
                chunk_text = (self._rerank_text(chunk) + " " + chunk.get("title", "")).lower()

                if query_entities:
                    entity_matched = any(e.lower() in chunk_text for e in query_entities)
                    if entity_matched:
                        score_float += 0.25
                    else:
                        score_float -= 0.35

                adjusted_scores.append(score_float)

            scored = sorted(
                zip(adjusted_scores, chunks),
                key=lambda x: float(x[0]),
                reverse=True,
            )

            seen_reranked = set()
            reranked = []
            filtered_count = 0
            min_score = settings.RERANKER_MIN_SCORE
            threshold_enabled = settings.RERANKER_ENABLE_THRESHOLD

            for score_float, chunk in scored:
                # Raw cross-encoder logits below -7.0 indicate strong negative relevance
                if threshold_enabled and score_float < min(-7.0, min_score):
                    filtered_count += 1
                    continue

                key = self._chunk_identity(chunk)
                if key in seen_reranked:
                    continue
                seen_reranked.add(key)

                enriched = dict(chunk)
                enriched["reranker_score"] = round(score_float, 4)
                reranked.append(enriched)

                if len(reranked) >= limit:
                    break

            # Fallback: if all candidate chunks were filtered by strict threshold, preserve top candidate
            if not reranked and scored:
                top_score, top_chunk = scored[0]
                enriched = dict(top_chunk)
                enriched["reranker_score"] = round(float(top_score), 4)
                reranked.append(enriched)

            logger.info(
                "Entity-Aware Reranked %d → %d chunks | filtered=%d | threshold=%s %.4f | best=%.4f",
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
            return chunks[:limit]

    async def async_rerank(
        self,
        query: str,
        chunks: list[dict],
        top_n: int | None = None,
    ) -> list[dict]:
        return await asyncio.to_thread(self.rerank, query, chunks, top_n)

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

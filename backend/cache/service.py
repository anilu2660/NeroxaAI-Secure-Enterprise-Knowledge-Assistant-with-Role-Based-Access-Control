"""
Semantic Query Cache Service

Provides semantic caching while isolating cached answers by authenticated user.
"""

import time
import logging
import numpy as np
from typing import Any
from backend.embeddings.service import embedding_service
from backend.config import settings

logger = logging.getLogger(__name__)


class SemanticCacheService:
    def __init__(self, similarity_threshold: float = 0.92, ttl_seconds: int = 300):
        self.threshold = similarity_threshold
        self.ttl_seconds = ttl_seconds
        self._cache: list[dict[str, Any]] = []

    def _cosine_similarity(
        self,
        vec_a: list[float],
        vec_b: list[float],
    ) -> float:
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def get(
        self,
        query: str,
        user_id: str,
        user_role: str,
        user_department: str,
    ) -> dict[str, Any] | None:
        now = time.time()
        self._cache = [
            e
            for e in self._cache
            if (now - e["created_at"]) < self.ttl_seconds
        ]

        if not self._cache or not user_id:
            return None

        try:
            query_vec = embedding_service.embed_query(query)
        except Exception as e:
            logger.warning(
                "Failed to embed query for cache lookup: %s",
                str(e),
            )
            return None

        best_score = 0.0
        best_entry = None

        for entry in self._cache:
            if entry["user_id"] != user_id:
                continue

            if (
                entry["department"] != user_department
                or entry["role"] != user_role
            ):
                continue

            sim = self._cosine_similarity(
                query_vec,
                entry["embedding"],
            )

            if sim > best_score:
                best_score = sim
                best_entry = entry

        if best_entry and best_score >= self.threshold:
            return {
                "query": query,
                "answer": best_entry["answer"],
                "sources": best_entry["sources"],
                "model": best_entry["model"],
                "chunks_retrieved": best_entry["chunks_retrieved"],
                "cached": True,
                "similarity_score": round(best_score, 4),
            }

        return None

    def set(
        self,
        query: str,
        answer: str,
        sources: list[dict],
        model: str,
        chunks_retrieved: int,
        user_id: str,
        user_role: str,
        user_department: str,
    ) -> None:
        if not user_id:
            return

        if (
            "cannot find sufficient information" in answer.lower()
            or "security alert" in answer.lower()
            or "access denied" in answer.lower()
        ):
            return

        try:
            query_vec = embedding_service.embed_query(query)
            self._cache.append({
                "query": query,
                "embedding": query_vec,
                "answer": answer,
                "sources": sources,
                "model": model,
                "chunks_retrieved": chunks_retrieved,
                "user_id": user_id,
                "role": user_role,
                "department": user_department,
                "created_at": time.time(),
            })
        except Exception as e:
            logger.warning(
                "Failed to store entry in semantic cache: %s",
                str(e),
            )

    def clear(self):
        self._cache.clear()


semantic_cache = SemanticCacheService(
    similarity_threshold=0.90,
    ttl_seconds=settings.CACHE_TTL_SECONDS,
)

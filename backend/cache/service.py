"""
Semantic Query Cache Service

Provides sub-50ms caching for semantically identical queries using dense embedding vector similarity.
"""

import time
import logging
import numpy as np
from typing import Any
from backend.embeddings.service import embedding_service
from backend.config import settings

logger = logging.getLogger(__name__)


class SemanticCacheService:
    """
    In-Memory Semantic Query Cache.

    Stores past query embedding vectors, answers, and sources.
    Performs cosine similarity checks against incoming queries.
    Enforces TTL expiration and RBAC scope isolation.
    """

    def __init__(self, similarity_threshold: float = 0.92, ttl_seconds: int = 300):
        self.threshold = similarity_threshold
        self.ttl_seconds = ttl_seconds
        # Structure: list of dicts with keys: query, embedding, answer, sources, model, department, role, created_at
        self._cache: list[dict[str, Any]] = []

    def _cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Compute cosine similarity between two 1D embedding vectors."""
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
        user_role: str,
        user_department: str,
    ) -> dict[str, Any] | None:
        """
        Check if a semantically equivalent query exists in cache for the given role/dept scope.

        Returns:
            dict with answer, sources, model, cached=True, latency_ms if hit, else None.
        """
        now = time.time()

        # Purge expired entries
        self._cache = [e for e in self._cache if (now - e["created_at"]) < self.ttl_seconds]

        if not self._cache:
            return None

        # Embed incoming query
        try:
            query_vec = embedding_service.embed_query(query)
        except Exception as e:
            logger.warning("Failed to embed query for cache lookup: %s", str(e))
            return None

        best_score = 0.0
        best_entry = None

        for entry in self._cache:
            # RBAC Isolation: Only hit cache if created under same department and role scope
            if entry["department"] == user_department and entry["role"] == user_role:
                sim = self._cosine_similarity(query_vec, entry["embedding"])
                if sim > best_score:
                    best_score = sim
                    best_entry = entry

        if best_entry and best_score >= self.threshold:
            logger.info(
                "SEMANTIC CACHE HIT | sim=%.4f >= %.2f | query='%s' ~ '%s'",
                best_score,
                self.threshold,
                query[:40],
                best_entry["query"][:40],
            )
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
        user_role: str,
        user_department: str,
    ):
        """
        Store query and response into semantic cache.
        """
        # Don't cache insufficient information or security alert refusals
        if "cannot find sufficient information" in answer.lower() or "security alert" in answer.lower():
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
                "role": user_role,
                "department": user_department,
                "created_at": time.time(),
            })
            logger.info("SEMANTIC CACHE STORED | query='%s'", query[:40])
        except Exception as e:
            logger.warning("Failed to store entry in semantic cache: %s", str(e))

    def clear(self):
        """Clear cache entries."""
        self._cache.clear()


semantic_cache = SemanticCacheService(
    similarity_threshold=0.90,
    ttl_seconds=settings.CACHE_TTL_SECONDS,
)

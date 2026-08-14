import asyncio
import hashlib
import json
import logging
from typing import Any

import numpy as np
import redis.asyncio as redis

from backend.config import settings
from backend.embeddings.service import embedding_service

logger = logging.getLogger(__name__)


class SemanticCacheService:
    def __init__(self, similarity_threshold: float = 0.90, ttl_seconds: int = 300):
        self.threshold = similarity_threshold
        self.ttl_seconds = ttl_seconds
        self.namespace = settings.CACHE_NAMESPACE
        self.client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=settings.REDIS_CONNECT_TIMEOUT_SECONDS,
            socket_timeout=settings.REDIS_TIMEOUT_SECONDS,
            health_check_interval=30,
        )

    @staticmethod
    def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
        a = np.asarray(vec_a, dtype=np.float32)
        b = np.asarray(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @staticmethod
    def _scope_key(user_id: str, user_role: str, user_department: str) -> str:
        scope = f"{user_id}|{user_role}|{user_department}"
        return hashlib.sha256(scope.encode("utf-8")).hexdigest()

    def _key(self, user_id: str, user_role: str, user_department: str) -> str:
        return f"{self.namespace}:semantic:{self._scope_key(user_id, user_role, user_department)}"

    async def _read_entries(self, key: str) -> list[dict[str, Any]]:
        raw = await self.client.get(key)
        if not raw:
            return []
        try:
            data = json.loads(raw)
            return data if isinstance(data, list) else []
        except (json.JSONDecodeError, TypeError):
            logger.warning("Invalid semantic cache payload encountered.")
            return []

    async def get(self, query: str, user_id: str, user_role: str, user_department: str) -> dict[str, Any] | None:
        if not user_id:
            return None
        try:
            query_vec = await asyncio.to_thread(embedding_service.embed_query, query)
            entries = await self._read_entries(self._key(user_id, user_role, user_department))
            best_score = 0.0
            best_entry = None
            for entry in entries:
                sim = self._cosine_similarity(query_vec, entry["embedding"])
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
        except Exception as exc:
            logger.warning("Semantic cache lookup failed; bypassing cache: %s", str(exc))
        return None

    async def set(self, query: str, answer: str, sources: list[dict], model: str, chunks_retrieved: int, user_id: str, user_role: str, user_department: str) -> None:
        if not user_id:
            return
        lowered = answer.lower()
        if any(marker in lowered for marker in ("cannot find sufficient information", "security alert", "access denied", "not authorized")):
            return
        try:
            query_vec = await asyncio.to_thread(embedding_service.embed_query, query)
            key = self._key(user_id, user_role, user_department)
            entries = await self._read_entries(key)
            entries.append({
                "query": query,
                "embedding": query_vec,
                "answer": answer,
                "sources": sources,
                "model": model,
                "chunks_retrieved": chunks_retrieved,
            })
            entries = entries[-settings.CACHE_MAX_ENTRIES_PER_SCOPE:]
            await self.client.setex(key, self.ttl_seconds, json.dumps(entries))
        except Exception as exc:
            logger.warning("Semantic cache write failed; continuing without cache: %s", str(exc))

    async def clear_scope(self, user_id: str, user_role: str, user_department: str) -> None:
        try:
            await self.client.delete(self._key(user_id, user_role, user_department))
        except Exception as exc:
            logger.warning("Semantic cache scope invalidation failed: %s", str(exc))

    async def clear_all(self) -> None:
        try:
            pattern = f"{self.namespace}:semantic:*"
            keys = [key async for key in self.client.scan_iter(match=pattern, count=200)]
            if keys:
                await self.client.delete(*keys)
        except Exception as exc:
            logger.warning("Semantic cache invalidation failed: %s", str(exc))

    async def health_check(self) -> bool:
        try:
            return bool(await self.client.ping())
        except Exception:
            return False

    async def close(self) -> None:
        await self.client.aclose()


semantic_cache = SemanticCacheService(
    similarity_threshold=0.90,
    ttl_seconds=settings.CACHE_TTL_SECONDS,
)

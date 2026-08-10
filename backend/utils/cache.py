"""
In-Memory Query Cache

Caches RAG query results based on MD5/SHA256 hash of:
(query_text + user_role + user_department + department_filter)

Provides TTL-based expiration and capacity-based LRU eviction.
Reduces redundant LLM and vector search execution for identical authorized queries.
"""

import time
import hashlib
import logging
from typing import Any

logger = logging.getLogger(__name__)


class QueryCache:
    """
    In-memory LRU query cache with TTL support.
    """

    def __init__(self, ttl_seconds: int = 300, max_size: int = 500):
        self.ttl = ttl_seconds
        self.max_size = max_size
        self._cache: dict[str, tuple[float, Any]] = {}

    def _generate_key(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
    ) -> str:
        """
        Generate a cache key scoped to user role and department for RBAC safety.
        """
        raw_key = f"{query.strip().lower()}:{user_role.lower()}:{user_department.lower()}:{department_filter or 'ALL'}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def get(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
    ) -> Any | None:
        """
        Retrieve cached result if present and not expired.
        """
        key = self._generate_key(query, user_role, user_department, department_filter)
        if key not in self._cache:
            return None

        timestamp, value = self._cache[key]
        if time.time() - timestamp > self.ttl:
            # Expired
            del self._cache[key]
            return None

        # Move to end (LRU behavior)
        self._cache[key] = (timestamp, value)
        logger.info("Query cache HIT for key %s...", key[:8])
        return value

    def set(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None,
        value: Any,
    ) -> None:
        """
        Store a result in cache with timestamp. Performs LRU eviction if full.
        """
        if len(self._cache) >= self.max_size:
            # Remove oldest item (first key in dict)
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        key = self._generate_key(query, user_role, user_department, department_filter)
        self._cache[key] = (time.time(), value)
        logger.info("Query cache STORE for key %s...", key[:8])

    def clear(self):
        """Clear all cached entries."""
        self._cache.clear()


query_cache = QueryCache()

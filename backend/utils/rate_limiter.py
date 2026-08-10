"""
API Rate Limiting Guardrails

Implements IP and User-based Token Bucket / Sliding Window Rate Limiting middleware
to protect endpoints from abuse, brute force attacks, and LLM/Vector DB exhaustion.

Rate Limits:
- Auth Endpoints (/login, /register): 10 requests / minute
- RAG Query Endpoint (/query): 30 requests / minute
- Document Upload Endpoint (/upload): 15 requests / minute
- General API Endpoints: 100 requests / minute
"""

import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from backend.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    In-Memory Sliding Window Rate Limiter.
    Tracks request timestamps per IP/Client identifier.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.history: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> tuple[bool, int]:
        """
        Check if client request is within allowed rate limit.

        Returns:
            (is_allowed: bool, retry_after_seconds: int)
        """
        now = time.time()
        cutoff = now - self.window_seconds

        # Clean up expired timestamps
        timestamps = [ts for ts in self.history[client_id] if ts > cutoff]
        self.history[client_id] = timestamps

        if len(timestamps) < self.requests_per_minute:
            self.history[client_id].append(now)
            return True, 0

        # Calculate retry after time
        oldest_ts = timestamps[0]
        retry_after = int(oldest_ts + self.window_seconds - now) + 1
        return False, max(1, retry_after)


# Global rate limiter instances for key route categories
auth_limiter = RateLimiter(requests_per_minute=10)        # 10 req/min for auth/login
query_limiter = RateLimiter(requests_per_minute=30)       # 30 req/min for RAG queries
upload_limiter = RateLimiter(requests_per_minute=15)      # 15 req/min for doc uploads
general_limiter = RateLimiter(requests_per_minute=100)    # 100 req/min general API


def rate_limit_guard(category: str = "general"):
    """
    FastAPI Dependency Guard for applying specific rate limits to routes.

    Usage:
        @router.post("/query", dependencies=[Depends(rate_limit_guard("query"))])
    """
    def guard(request: Request):
        # SECURITY: Only trust X-Forwarded-For if the direct client is a
        # known private/proxy IP (e.g., nginx, docker gateway, LB).
        # Public clients cannot spoof this header to bypass rate limiting.
        direct_ip = request.client.host if request.client else "127.0.0.1"
        forwarded_for = request.headers.get("X-Forwarded-For")

        # Private IP ranges used by reverse proxies / load balancers
        PRIVATE_PREFIXES = ("127.", "10.", "172.16.", "172.17.", "192.168.", "::1")
        is_trusted_proxy = any(direct_ip.startswith(p) for p in PRIVATE_PREFIXES)

        if forwarded_for and is_trusted_proxy:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = direct_ip

        limiter = general_limiter
        if category == "auth":
            limiter = auth_limiter
        elif category == "query":
            limiter = query_limiter
        elif category == "upload":
            limiter = upload_limiter

        allowed, retry_after = limiter.is_allowed(client_ip)

        if not allowed:
            logger.warning(
                "Rate limit EXCEEDED | IP: %s | Category: %s | Retry after: %ds",
                client_ip,
                category,
                retry_after,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for '{category}'. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

    return guard

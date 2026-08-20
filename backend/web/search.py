import asyncio
import logging
from dataclasses import dataclass
from urllib.parse import urlparse

from backend.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class WebSearchResult:
    title: str
    url: str
    snippet: str
    source: str


class WebSearchService:
    def __init__(self):
        self.max_results = settings.WEB_SEARCH_MAX_RESULTS
        self.timeout_seconds = settings.WEB_SEARCH_TIMEOUT_SECONDS
        self.location = settings.WEB_SEARCH_LOCATION
        self.language = settings.WEB_SEARCH_LANGUAGE
        self.country = settings.WEB_SEARCH_COUNTRY

    @staticmethod
    def _clean_text(value: object, limit: int = 1200) -> str:
        return " ".join(str(value or "").split())[:limit]

    @staticmethod
    def _valid_url(url: str) -> bool:
        try:
            parsed = urlparse(url)
            return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
        except Exception:
            return False

    def _search_sync(self, query: str) -> list[WebSearchResult]:
        if not settings.SERPAPI_KEY:
            raise RuntimeError("SERPAPI_KEY is not configured.")

        raw_results = []
        try:
            import serpapi
            client = serpapi.Client(
                api_key=settings.SERPAPI_KEY,
                timeout=self.timeout_seconds,
            )
            params = {
                "engine": "google",
                "q": query,
                "num": self.max_results,
                "hl": self.language,
                "gl": self.country,
            }
            if self.location:
                params["location"] = self.location

            results = client.search(params)
            raw_results = results.get("organic_results", [])
        except Exception as err:
            logger.info("serpapi package search failed, trying httpx fallback: %s", str(err))
            import httpx
            params = {
                "api_key": settings.SERPAPI_KEY,
                "engine": "google",
                "q": query,
                "num": self.max_results,
                "hl": self.language,
                "gl": self.country,
            }
            if self.location:
                params["location"] = self.location

            with httpx.Client(timeout=self.timeout_seconds) as client:
                res = client.get(settings.SERPAPI_BASE_URL, params=params)
                if res.status_code == 200:
                    raw_results = res.json().get("organic_results", [])
                else:
                    logger.error("SerpAPI HTTP request failed with status %s: %s", res.status_code, res.text)

        normalized: list[WebSearchResult] = []
        for item in raw_results:
            url = str(item.get("link") or "").strip()
            if not self._valid_url(url):
                continue

            title = self._clean_text(item.get("title"), 300)
            snippet = self._clean_text(item.get("snippet"), 1000)
            source = urlparse(url).netloc.lower()

            if title and snippet:
                normalized.append(
                    WebSearchResult(
                        title=title,
                        url=url,
                        snippet=snippet,
                        source=source,
                    )
                )

            if len(normalized) >= self.max_results:
                break

        return normalized

    async def search(self, query: str) -> list[WebSearchResult]:
        query = query.strip()
        if not query:
            raise ValueError("Web search query cannot be empty.")

        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._search_sync, query),
                timeout=self.timeout_seconds + 2,
            )
        except asyncio.TimeoutError as exc:
            logger.warning("SerpApi web search timed out.")
            raise TimeoutError("Web search timed out.") from exc
        except Exception as exc:
            logger.exception("SerpApi web search failed: %s", str(exc))
            raise RuntimeError("Web search is temporarily unavailable.") from exc


web_search_service = WebSearchService()

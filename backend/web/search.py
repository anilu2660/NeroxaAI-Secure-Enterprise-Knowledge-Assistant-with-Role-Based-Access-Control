import asyncio
import logging
from dataclasses import dataclass
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class WebSearchResult:
    title: str
    url: str
    snippet: str
    source: str


class WebSearchService:
    def __init__(self, max_results: int = 5, timeout_seconds: float = 10.0):
        self.max_results = max_results
        self.timeout_seconds = timeout_seconds

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
        from ddgs import DDGS

        results: list[WebSearchResult] = []
        with DDGS() as client:
            raw_results = client.text(
                query,
                max_results=self.max_results,
                safesearch="moderate",
            )

            for item in raw_results or []:
                url = str(item.get("href") or item.get("url") or "").strip()
                if not self._valid_url(url):
                    continue
                title = self._clean_text(item.get("title"), 300)
                snippet = self._clean_text(item.get("body") or item.get("snippet"), 1000)
                source = urlparse(url).netloc.lower()
                if title and snippet:
                    results.append(
                        WebSearchResult(
                            title=title,
                            url=url,
                            snippet=snippet,
                            source=source,
                        )
                    )

        return results

    async def search(self, query: str) -> list[WebSearchResult]:
        query = query.strip()
        if not query:
            raise ValueError("Web search query cannot be empty.")

        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._search_sync, query),
                timeout=self.timeout_seconds,
            )
        except asyncio.TimeoutError as exc:
            logger.warning("Web search timed out for query.")
            raise TimeoutError("Web search timed out.") from exc
        except Exception as exc:
            logger.exception("Web search failed: %s", str(exc))
            raise RuntimeError("Web search is temporarily unavailable.") from exc


web_search_service = WebSearchService()

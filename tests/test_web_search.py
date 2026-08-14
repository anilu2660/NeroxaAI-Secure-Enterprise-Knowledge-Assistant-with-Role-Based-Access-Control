import pytest

from backend.web.search import WebSearchResult, WebSearchService


def test_valid_web_url():
    assert WebSearchService._valid_url("https://example.com/page") is True
    assert WebSearchService._valid_url("http://example.com") is True
    assert WebSearchService._valid_url("javascript:alert(1)") is False
    assert WebSearchService._valid_url("not-a-url") is False


def test_clean_text():
    value = WebSearchService._clean_text("  hello\n world  ")
    assert value == "hello world"


def test_web_result_shape():
    result = WebSearchResult(
        title="Example",
        url="https://example.com",
        snippet="Example snippet",
        source="example.com",
    )
    assert result.url.startswith("https://")

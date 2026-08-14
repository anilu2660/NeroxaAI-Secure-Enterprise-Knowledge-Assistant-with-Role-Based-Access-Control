import pytest

from backend.query.rewriter import QueryRewriter


@pytest.mark.asyncio
async def test_rewriter_returns_original_query_without_history():
    rewriter = QueryRewriter()
    query = "What is the leave policy?"
    assert await rewriter.rewrite(query) == query


@pytest.mark.asyncio
async def test_rewriter_uses_llm_for_follow_up(monkeypatch):
    class FakeLLM:
        async def generate_text(self, **kwargs):
            return '{"rewritten_query":"What is the company leave policy for interns?"}'

    rewriter = QueryRewriter()
    rewriter.llm = FakeLLM()

    result = await rewriter.rewrite(
        "What about interns?",
        "User: What is the company leave policy?",
    )

    assert result == "What is the company leave policy for interns?"

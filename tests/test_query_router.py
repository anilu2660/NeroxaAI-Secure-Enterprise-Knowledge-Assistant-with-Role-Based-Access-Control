import pytest

from backend.router.schemas import QueryRoute
from backend.router.service import QueryRouter


@pytest.mark.parametrize(
    "query, expected_route",
    [
        ("Hello, how are you?", QueryRoute.CASUAL),
        ("What is our employee leave policy?", QueryRoute.ENTERPRISE),
        ("What is the latest RBI announcement today?", QueryRoute.WEB),
        (
            "According to our travel policy, what are the latest airline baggage rules?",
            QueryRoute.HYBRID,
        ),
    ],
)
def test_heuristic_router(query, expected_route):
    router = QueryRouter()
    decision = router._heuristic_route(query)
    assert decision is not None
    assert decision.route == expected_route


def test_empty_query_rejected():
    router = QueryRouter()
    with pytest.raises(ValueError):
        import asyncio
        asyncio.run(router.route("   "))

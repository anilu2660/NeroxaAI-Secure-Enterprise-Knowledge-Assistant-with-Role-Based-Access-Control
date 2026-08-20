"""Unit tests for Structured Entity Lookup and Reranker Thresholding."""

import pytest
from backend.rag.structured_lookup import StructuredEntityLookup
from backend.retriever.reranker import CrossEncoderReranker


def test_match_employee_query():
    lookup = StructuredEntityLookup()
    assert lookup.match_employee_query("Who is Anil Upadhyay?") == "Anil Upadhyay"
    assert lookup.match_employee_query("What is Sarah Jenkins's role?") == "Sarah Jenkins"
    assert lookup.match_employee_query("What is the general company leave policy?") is None


def test_entity_aware_reranking_boost():
    reranker = CrossEncoderReranker()
    chunks = [
        {"content": "The travel allowance for all employees is $50 per day.", "title": "Travel Policy", "page_number": 1, "id": "1"},
        {"content": "Anil Upadhyay is the Senior Engineering Lead for the AI Platform.", "title": "Team Directory", "page_number": 1, "id": "2"},
    ]
    # Query targets Anil Upadhyay
    results = reranker.rerank("What is Anil Upadhyay's role?", chunks, top_n=2)
    assert len(results) >= 1
    # Chunk containing the exact entity should be top-ranked
    assert "Anil Upadhyay" in results[0]["content"]

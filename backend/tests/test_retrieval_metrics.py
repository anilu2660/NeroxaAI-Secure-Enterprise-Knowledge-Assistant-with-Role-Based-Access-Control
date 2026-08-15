"""Offline retrieval evaluation helpers.

These tests intentionally do not require Qdrant, Ollama, or a running backend.
They validate ranking metrics against a deterministic set of retrieved chunk IDs.
Use the same helpers with real retriever output to measure Recall@K and MRR.
"""

from backend.retriever.metrics import mean_reciprocal_rank, recall_at_k



def test_recall_at_k():
    ranked = ["chunk-a", "chunk-b", "chunk-c", "chunk-d"]
    relevant = {"chunk-c", "chunk-z"}

    assert recall_at_k(ranked, relevant, 1) == 0.0
    assert recall_at_k(ranked, relevant, 3) == 0.5
    assert recall_at_k(ranked, relevant, 4) == 0.5



def test_recall_is_one_when_all_relevant_items_are_retrieved():
    ranked = ["chunk-a", "chunk-b", "chunk-c"]
    relevant = {"chunk-a", "chunk-c"}

    assert recall_at_k(ranked, relevant, 3) == 1.0



def test_recall_returns_zero_for_empty_relevance_set():
    assert recall_at_k(["chunk-a"], set(), 5) == 0.0



def test_mrr_uses_first_relevant_result():
    ranked = ["wrong-1", "wrong-2", "chunk-c", "chunk-d"]
    relevant = {"chunk-c", "chunk-d"}

    assert mean_reciprocal_rank([ranked], [relevant]) == 1 / 3



def test_mrr_is_zero_when_no_relevant_result_exists():
    assert mean_reciprocal_rank([["wrong-1", "wrong-2"]], [{"chunk-c"}]) == 0.0

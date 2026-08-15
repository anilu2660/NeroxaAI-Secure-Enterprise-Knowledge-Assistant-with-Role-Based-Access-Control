"""Run the Finance Policy retrieval benchmark.

Usage from the repository root:
    python -m backend.tests.retrieval_eval.run_eval

This evaluates retrieval + reranking only. It does not call the LLM.
The benchmark compares retrieved document/page metadata with the expected
source pages in finance_policy_eval.json and prints Recall@5, Recall@10 and
MRR plus per-query diagnostics.
"""

"""Run the Finance Policy retrieval benchmark.

Usage from the repository root:
    python -m backend.tests.retrieval_eval.run_eval

This evaluates retrieval + reranking only. It does not call the LLM.
The benchmark compares retrieved document/page metadata with the expected
source pages in finance_policy_eval.json and prints Recall@5, Recall@10 and
MRR plus per-query diagnostics.
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from backend.rag.service import rag_service
from backend.retriever.metrics import mean_reciprocal_rank, recall_at_k


DATASET = Path(__file__).with_name("finance_policy_eval.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate NeroxaAI retrieval on Finance Policy queries")
    parser.add_argument("--user-id", default="retrieval-eval-user")
    parser.add_argument("--role", default="admin")
    parser.add_argument("--department", default="General")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--output", default="retrieval_eval_results.json")
    return parser.parse_args()


def is_expected_source(chunk: dict, case: dict) -> bool:
    document = str(chunk.get("title", "")).lower()
    expected_document = str(case["document"]).lower()
    if document != expected_document and expected_document not in document:
        return False
    try:
        page = int(chunk.get("page_number"))
    except (TypeError, ValueError):
        return False
    return page in {int(p) for p in case["pages"]}


async def evaluate(args: argparse.Namespace) -> dict:
    cases = json.loads(DATASET.read_text(encoding="utf-8"))
    ranked_relevance: list[list[str]] = []
    relevant_sets: list[set[str]] = []
    details = []

    for case in cases:
        chunks = await rag_service._retrieve_and_rerank(
            query=case["query"],
            user_id=args.user_id,
            user_role=args.role,
            user_department=args.department,
            department_filter=None,
            top_k=max(args.top_k, 10),
        )

        ranked_ids = [str(chunk.get("point_id")) for chunk in chunks]
        relevant_ids = {
            str(chunk.get("point_id"))
            for chunk in chunks
            if is_expected_source(chunk, case)
        }

        ranked_relevance.append(ranked_ids)
        relevant_sets.append(relevant_ids)

        details.append({
            "id": case["id"],
            "query": case["query"],
            "expected_document": case["document"],
            "expected_pages": case["pages"],
            "retrieved": [
                {
                    "point_id": chunk.get("point_id"),
                    "document": chunk.get("title"),
                    "page": chunk.get("page_number"),
                    "section": chunk.get("section_title"),
                    "chunk_index": chunk.get("chunk_index"),
                    "dense_score": chunk.get("dense_score"),
                    "dense_rank": chunk.get("dense_rank"),
                    "sparse_score": chunk.get("sparse_score"),
                    "sparse_rank": chunk.get("sparse_rank"),
                    "rrf_score": chunk.get("rrf_score"),
                    "reranker_score": chunk.get("reranker_score"),
                    "expected_source": is_expected_source(chunk, case),
                }
                for chunk in chunks
            ],
            "hit_at_5": any(is_expected_source(c, case) for c in chunks[:5]),
            "hit_at_10": any(is_expected_source(c, case) for c in chunks[:10]),
        })

    # For page-level relevance, each case has at least one relevant result if
    # the expected document/page appears in the ranked list. Build synthetic
    # relevant IDs from the observed ranked results for metric calculation.
    page_relevant_sets = []
    for case, ranked in zip(cases, details):
        relevant = {
            item["point_id"]
            for item in ranked["retrieved"]
            if item["expected_source"]
        }
        page_relevant_sets.append(relevant)

    metrics = {
        "queries": len(cases),
        "recall_at_5": sum(d["hit_at_5"] for d in details) / len(details),
        "recall_at_10": sum(d["hit_at_10"] for d in details) / len(details),
        "mrr": mean_reciprocal_rank(ranked_relevance, page_relevant_sets),
    }

    result = {
        "config": {
            "user_id": args.user_id,
            "role": args.role,
            "department": args.department,
            "top_k": args.top_k,
        },
        "metrics": metrics,
        "details": details,
    }
    Path(args.output).write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main() -> None:
    args = parse_args()
    result = asyncio.run(evaluate(args))
    metrics = result["metrics"]
    print("\nNeroxaAI Retrieval Evaluation")
    print("=" * 32)
    print(f"Queries    : {metrics['queries']}")
    print(f"Recall@5   : {metrics['recall_at_5']:.3f}")
    print(f"Recall@10  : {metrics['recall_at_10']:.3f}")
    print(f"MRR        : {metrics['mrr']:.3f}")
    print(f"Results    : {args.output}")

    failures = [d for d in result["details"] if not d["hit_at_5"]]
    if failures:
        print("\nQueries missing the expected source in Top-5:")
        for item in failures:
            print(f"- {item['id']}: {item['query']}")


if __name__ == "__main__":
    main()

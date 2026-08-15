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
from backend.retriever.metrics import mean_reciprocal_rank

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


async def ensure_dataset_indexed() -> None:
    from backend.documents.service import document_service
    pdf_path = Path(__file__).resolve().parents[3] / "docs" / "finance_policy.pdf"
    if not pdf_path.exists():
        return

    client = document_service.retriever.client
    collection_name = document_service.retriever.collection
    needs_ingest = False

    try:
        collections = client.get_collections()
        c_names = [c.name for c in collections.collections]
        if collection_name not in c_names:
            needs_ingest = True
        else:
            count_res = client.count(collection_name=collection_name)
            if count_res.count == 0:
                needs_ingest = True
    except Exception:
        needs_ingest = True

    if needs_ingest:
        print(f"[*] Ingesting evaluation dataset '{pdf_path.name}' into Qdrant vector database...")
        await document_service.ingest_document(
            filename="finance_policy.pdf",
            file_bytes=pdf_path.read_bytes(),
            department="Finance",
            owner="admin",
            owner_id="admin-eval",
        )
        print("[+] Dataset document indexed successfully.")


async def evaluate(args: argparse.Namespace) -> dict:
    await ensure_dataset_indexed()
    cases = json.loads(DATASET.read_text(encoding="utf-8"))
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

    ranked_lists = []
    relevant_sets = []
    for item in details:
        ranked = [str(x["point_id"]) for x in item["retrieved"]]
        relevant = {str(x["point_id"]) for x in item["retrieved"] if x["expected_source"]}
        ranked_lists.append(ranked)
        relevant_sets.append(relevant)

    metrics = {
        "queries": len(cases),
        "recall_at_5": sum(d["hit_at_5"] for d in details) / len(details),
        "recall_at_10": sum(d["hit_at_10"] for d in details) / len(details),
        "mrr": mean_reciprocal_rank(ranked_lists, relevant_sets),
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

    failures = [d for d in result["details"] if not d["hit_at_5"]]
    if failures:
        print("\nQueries missing the expected source in Top-5:")
        for item in failures:
            print(f"\n- {item['id']}: {item['query']}")
            print(f"  Expected: {item['expected_document']} page(s) {item['expected_pages']}")
            print("  Retrieved candidates:")
            for rank, candidate in enumerate(item["retrieved"], start=1):
                print(
                    f"    {rank}. page={candidate['page']} section={candidate['section']!r} "
                    f"chunk={candidate['chunk_index']} method_scores="
                    f"dense:{candidate['dense_score']} sparse:{candidate['sparse_score']} "
                    f"rrf:{candidate['rrf_score']} rerank:{candidate['reranker_score']}"
                )

    print(f"\nResults    : {args.output}")


if __name__ == "__main__":
    main()

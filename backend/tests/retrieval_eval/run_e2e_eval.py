"""End-to-end RAG evaluation runner.

Runs the same 30-query Finance Policy benchmark through the complete pipeline:
query routing -> retrieval -> reranking -> context construction -> Ollama LLM.

This is a diagnostic runner, not an automatic answer grader. Retrieval
correctness is measured separately by run_eval.py. This runner records the
answer and citations so answer quality can be reviewed without pretending a
simple string match is a reliable semantic judge.

Run from repository root:
    python -m backend.tests.retrieval_eval.run_e2e_eval
"""

import asyncio
import json
import re
from pathlib import Path

from backend.rag.service import rag_service


DATASET = Path(__file__).with_name("finance_policy_eval.json")
OUTPUT = Path(__file__).with_name("e2e_eval_results.json")


def _normalize_page(value):
    """Normalize page values so int/string representations compare equally."""
    if value is None:
        return None
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else None


def _normalize_document(value):
    """Normalize document names without weakening the identity check."""
    if value is None:
        return ""
    return re.sub(r"\s+", " ", Path(str(value)).name.strip().lower())


def _source_hit(sources: list[dict], expected_document: str, expected_pages: list[int]) -> bool:
    expected_doc = _normalize_document(expected_document)
    expected_page_set = {_normalize_page(page) for page in expected_pages}

    for source in sources:
        source_doc = _normalize_document(
            source.get("title")
            or source.get("document_title")
            or source.get("documentTitle")
        )
        source_page = _normalize_page(source.get("page") or source.get("page_number"))

        if source_doc == expected_doc and source_page in expected_page_set:
            return True

    return False


async def evaluate() -> None:
    queries = json.loads(DATASET.read_text(encoding="utf-8"))
    results = []

    for index, item in enumerate(queries, start=1):
        print(f"[{index:02d}/{len(queries)}] {item['id']}: {item['query']}")

        try:
            result = await rag_service.query(
                query=item["query"],
                # Evaluation uses an admin-scoped identity so RBAC does not
                # hide authorized benchmark documents from the LLM test.
                user_id="e2e-evaluation-admin",
                user_role="admin",
                user_department="General",
                department_filter=None,
                top_k=5,
                temperature=0.0,
            )

            sources = result.get("sources", [])
            source_hit = _source_hit(
                sources,
                item.get("document", ""),
                item.get("pages", []),
            )

            results.append({
                "id": item["id"],
                "query": item["query"],
                "expected_document": item.get("document"),
                "expected_pages": item.get("pages", []),
                "answer": result.get("answer", ""),
                "model": result.get("model"),
                "sources": sources,
                "source_hit": source_hit,
                "chunks_retrieved": result.get("chunks_retrieved", 0),
                "error": None,
            })
        except Exception as exc:
            results.append({
                "id": item["id"],
                "query": item["query"],
                "expected_document": item.get("document"),
                "expected_pages": item.get("pages", []),
                "answer": "",
                "model": None,
                "sources": [],
                "source_hit": False,
                "chunks_retrieved": 0,
                "error": str(exc),
            })
            print(f"  ERROR: {exc}")

    source_hits = sum(1 for result in results if result["source_hit"])
    errors = sum(1 for result in results if result["error"])

    payload = {
        "queries": len(results),
        "source_hit_rate": source_hits / len(results) if results else 0.0,
        "errors": errors,
        "model": results[0].get("model") if results else None,
        "results": results,
    }

    OUTPUT.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("\nNeroxaAI End-to-End RAG Evaluation")
    print("==================================")
    print(f"Queries          : {len(results)}")
    print(f"Expected source  : {source_hits}/{len(results)} ({payload['source_hit_rate']:.1%})")
    print(f"LLM errors       : {errors}")
    print(f"Results          : {OUTPUT}")
    print("\nSource matching is normalized for page/document representation. Review")
    print("e2e_eval_results.json for generated-answer correctness, faithfulness,")
    print("citation accuracy, and hallucinations.")


if __name__ == "__main__":
    asyncio.run(evaluate())

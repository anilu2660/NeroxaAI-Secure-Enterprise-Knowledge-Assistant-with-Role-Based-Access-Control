import os

# The application configuration requires a JWT secret during import.
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-key-with-at-least-32-bytes")

from backend.documents.chunker import DocumentChunker
from backend.embeddings.sparse import BM25SparseEncoder


def test_chunker_preserves_numbered_policy_section():
    chunker = DocumentChunker(chunk_size=1200, chunk_overlap=200)
    pages = [{
        "page_number": 9,
        "text": (
            "13. Control of Income\n"
            "The University shall control all income received.\n"
            "a. Control of Income\n"
            "Any proposal to establish a new source of University income shall be considered.\n"
            "Prior approval and financial implications shall be considered before implementation."
        ),
    }]

    chunks = chunker.chunk_pages(
        pages=pages,
        document_title="finance_policy.pdf",
        department="Finance",
        document_id="doc-1",
        owner="admin",
        owner_id="admin-1",
    )

    assert chunks
    assert any("13. Control of Income" in c["content"] for c in chunks)
    assert any("new source of University income" in c["raw_text"] for c in chunks)
    assert all(c["parent_id"].startswith("doc-1_p9_") for c in chunks)


def test_sparse_term_indices_are_deterministic():
    encoder = BM25SparseEncoder()
    first = encoder.encode("University revenue source approval financial implications")
    second = encoder.encode("University revenue source approval financial implications")

    assert first.indices == second.indices
    assert first.values == second.values


def test_sparse_query_and_document_share_term_indices():
    encoder = BM25SparseEncoder()
    query = encoder.encode("financial approval")
    document = encoder.encode("financial approval is required")

    assert set(query.indices).intersection(document.indices)

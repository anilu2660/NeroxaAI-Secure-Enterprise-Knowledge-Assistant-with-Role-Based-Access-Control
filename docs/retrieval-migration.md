# Retrieval Pipeline Migration

This change updates chunking and sparse term indexing. Existing Qdrant points are not automatically rewritten.

## Required after merging

1. Stop the application before rebuilding the knowledge base.
2. Re-ingest every source document so chunks are generated with the new structure-aware chunker.
3. Rebuild the Qdrant collection or delete/recreate the affected document points before re-ingesting them.
4. Do not mix old and new sparse vectors in the same collection because the sparse term-index mapping is now deterministic and differs from the old Python `hash()` mapping.
5. Clear Redis semantic-cache entries, or allow the new `RETRIEVAL_PIPELINE_VERSION=2` namespace to isolate old entries.
6. Run the retrieval regression tests before accepting production traffic.

## Why re-indexing is required

The new chunker stores section-aware metadata and the sparse encoder uses a deterministic term hash. Existing vectors were produced using the previous chunk boundaries and Python process-dependent hash mapping, so they should not be treated as compatible with the new retrieval pipeline.

"""
Qdrant-compatible BM25 sparse encoder.

Uses FastEmbed's Qdrant/bm25 implementation for tokenization, stemming and
BM25 term-frequency weighting. Qdrant applies the corpus-level IDF modifier
at search time, so document/query token IDs stay compatible without a custom
hash vocabulary.
"""

from functools import lru_cache

from fastembed import SparseTextEmbedding
from qdrant_client.models import SparseVector

BM25_K1 = 1.2
BM25_B = 0.75
# This is deliberately configurable because BM25 length normalization should
# reflect the indexed chunk distribution. Rebuild vectors when this changes.
BM25_AVG_LEN = 120.0


class BM25SparseEncoder:
    def __init__(self):
        self.model_name = "Qdrant/bm25"
        self._model: SparseTextEmbedding | None = None

    @property
    def model(self) -> SparseTextEmbedding:
        if self._model is None:
            self._model = SparseTextEmbedding(
                model_name=self.model_name,
                k=BM25_K1,
                b=BM25_B,
                avg_len=BM25_AVG_LEN,
                language="english",
            )
        return self._model

    @staticmethod
    def _to_sparse_vector(embedding) -> SparseVector:
        indices = embedding.indices.tolist() if hasattr(embedding.indices, "tolist") else list(embedding.indices)
        values = embedding.values.tolist() if hasattr(embedding.values, "tolist") else list(embedding.values)
        return SparseVector(
            indices=[int(i) for i in indices],
            values=[float(v) for v in values],
        )

    def encode(self, text: str) -> SparseVector:
        if not text or not text.strip():
            return SparseVector(indices=[], values=[])
        embedding = next(self.model.embed([text]))
        return self._to_sparse_vector(embedding)

    def encode_query(self, text: str) -> SparseVector:
        if not text or not text.strip():
            return SparseVector(indices=[], values=[])
        embedding = next(self.model.query_embed(text))
        return self._to_sparse_vector(embedding)

    def encode_batch(self, texts: list[str]) -> list[SparseVector]:
        if not texts:
            return []
        embeddings = self.model.embed(texts, batch_size=256)
        return [self._to_sparse_vector(embedding) for embedding in embeddings]


bm25_encoder = BM25SparseEncoder()

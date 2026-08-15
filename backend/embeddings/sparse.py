"""
Deterministic BM25-style sparse encoder for Qdrant hybrid retrieval.

This remains a lightweight TF/BM25-style encoder, but term indices are now
stable across Python processes. Existing Qdrant sparse vectors must be rebuilt
after this change because the sparse vocabulary mapping has changed.
"""

import hashlib
import re
from collections import Counter

from qdrant_client.models import SparseVector

BM25_K1 = 1.5
BM25_B = 0.75
AVG_DOC_LEN = 120

STOP_WORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "this", "that",
    "these", "those", "i", "you", "he", "she", "it", "we", "they",
    "what", "which", "who", "whom", "how", "when", "where", "why", "not",
    "its", "their", "our", "your", "his", "her", "as", "if", "then",
})


class BM25SparseEncoder:
    VOCAB_SIZE = 2 ** 21

    def _tokenize(self, text: str) -> list[str]:
        tokens = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())
        return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]

    def _term_index(self, term: str) -> int:
        """Stable term-to-index mapping shared by ingestion and query processes."""
        digest = hashlib.blake2b(term.encode("utf-8"), digest_size=8).digest()
        return int.from_bytes(digest, "big") % self.VOCAB_SIZE

    def encode(self, text: str) -> SparseVector:
        tokens = self._tokenize(text)
        if not tokens:
            return SparseVector(indices=[], values=[])

        doc_len = len(tokens)
        term_freq = Counter(tokens)
        index_to_score: dict[int, float] = {}

        for term, tf in term_freq.items():
            idx = self._term_index(term)
            bm25_tf = (tf * (BM25_K1 + 1)) / (
                tf + BM25_K1 * (1 - BM25_B + BM25_B * (doc_len / AVG_DOC_LEN))
            )
            index_to_score[idx] = index_to_score.get(idx, 0.0) + bm25_tf

        sorted_items = sorted(index_to_score.items())
        return SparseVector(
            indices=[item[0] for item in sorted_items],
            values=[round(item[1], 6) for item in sorted_items],
        )

    def encode_batch(self, texts: list[str]) -> list[SparseVector]:
        return [self.encode(text) for text in texts]


bm25_encoder = BM25SparseEncoder()

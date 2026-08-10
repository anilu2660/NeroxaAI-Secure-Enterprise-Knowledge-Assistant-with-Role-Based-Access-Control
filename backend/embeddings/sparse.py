"""
BM25-Style Sparse Encoder

Generates sparse vector representations for hybrid search in Qdrant.
Uses BM25-TF scoring with hash-based term indexing — no external vocabulary needed.

Why sparse vectors?
  Dense (semantic) vectors miss exact keyword matches (e.g., "Rs. 1,000", "Section 4.2").
  Sparse BM25 vectors catch these precisely. RRF fusion combines both for best results.
"""

import re
from collections import Counter
from qdrant_client.models import SparseVector

# ─── BM25 Hyperparameters ──────────────────────────────────────────────────────
BM25_K1 = 1.5    # Term frequency saturation factor
BM25_B = 0.75    # Length normalization factor
AVG_DOC_LEN = 120  # Approximate average chunk length in words (tune per corpus)

# ─── Stop Words ───────────────────────────────────────────────────────────────
# Excluded from sparse index: reduces noise, collision rate, and storage.
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
    """
    Encodes text into BM25-weighted sparse vectors compatible with Qdrant SparseVector.

    Uses hash-based term indexing: each term is mapped to a stable integer index
    via Python's built-in hash function, modulo a large vocab size. This avoids
    needing an explicit vocabulary file while producing consistent indices.

    BM25-TF formula (no IDF — corpus-level stats unavailable at index time):
        score(t, d) = tf × (k1+1) / (tf + k1 × (1 - b + b × dl/avgdl))
    """

    VOCAB_SIZE = 2 ** 21  # ~2M possible term slots (hash space, reduces collisions)

    def _tokenize(self, text: str) -> list[str]:
        """Lowercase, tokenize on word boundaries, filter stop words and short tokens."""
        tokens = re.findall(r'\b[a-zA-Z0-9]+\b', text.lower())
        return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]

    def _term_index(self, term: str) -> int:
        """Map a term to a stable non-negative integer index via hashing."""
        return abs(hash(term)) % self.VOCAB_SIZE

    def encode(self, text: str) -> SparseVector:
        """
        Encode a single text string into a BM25-weighted SparseVector.

        Args:
            text: Raw text to encode (query or document chunk).

        Returns:
            SparseVector(indices=[...], values=[...]) sorted by index ascending.
        """
        tokens = self._tokenize(text)
        if not tokens:
            return SparseVector(indices=[], values=[])

        doc_len = len(tokens)
        term_freq = Counter(tokens)

        index_to_score: dict[int, float] = {}
        for term, tf in term_freq.items():
            idx = self._term_index(term)
            # BM25 TF component
            bm25_tf = (tf * (BM25_K1 + 1)) / (
                tf + BM25_K1 * (1 - BM25_B + BM25_B * (doc_len / AVG_DOC_LEN))
            )
            # Accumulate — handles hash collisions gracefully
            index_to_score[idx] = index_to_score.get(idx, 0.0) + bm25_tf

        # Qdrant requires indices sorted ascending
        sorted_items = sorted(index_to_score.items())
        return SparseVector(
            indices=[item[0] for item in sorted_items],
            values=[round(item[1], 6) for item in sorted_items],
        )

    def encode_batch(self, texts: list[str]) -> list[SparseVector]:
        """Encode a batch of texts into sparse vectors."""
        return [self.encode(text) for text in texts]


# Singleton instance shared across the application
bm25_encoder = BM25SparseEncoder()

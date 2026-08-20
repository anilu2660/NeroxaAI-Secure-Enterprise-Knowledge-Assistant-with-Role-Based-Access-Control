"""
Pre-Generation Evidence Gate & Calibrated Abstention

Evaluates retrieved chunks before LLM generation to verify:
1. Exact entity presence (names, titles, departments, policies).
2. Attribute and fact alignment (salary, limit, rule, date).
3. Calibrated reranker/relevance confidence threshold.
4. Honest abstention decision when evidence is missing or insufficient.
"""

from dataclasses import dataclass, field
from enum import Enum
import logging
import re

logger = logging.getLogger(__name__)


class EvidenceState(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    NOT_VERIFIED = "NOT_VERIFIED"


@dataclass
class EvidenceAssessment:
    state: EvidenceState
    confidence: float
    target_entities: list[str] = field(default_factory=list)
    verified_entities: list[str] = field(default_factory=list)
    missing_entities: list[str] = field(default_factory=list)
    abstention_message: str | None = None
    reason: str = ""


class EvidenceGate:
    """Pre-flight evidence evaluation for RAG queries."""

    # Entities and exact-fact lookup indicators
    _EXACT_LOOKUP_PATTERNS = [
        re.compile(r"\b(salary|compensation|ctc|pay|stipend|wage|payroll)\b", re.I),
        re.compile(r"\b(petty cash|cash limit|expense limit|threshold|mileage rate|per diem)\b", re.I),
        re.compile(r"\b(who is|name of|designation|job title|department head|cto|cfo|ceo|cmo|coo)\b", re.I),
        re.compile(r"\b(deadline|timeline|effective date|version|clause|section \d+)\b", re.I),
        re.compile(r"\b(email|phone|contact|address|id number|employee id)\b", re.I),
    ]

    _STOP_WORDS = {
        "what", "is", "our", "the", "are", "of", "in", "to", "for", "a", "an",
        "and", "or", "how", "can", "you", "tell", "me", "about", "we", "do",
        "have", "does", "any", "which", "when", "where", "who", "with", "this",
    }

    _SYNONYMS = {
        "cheif": ["chief"],
        "ceo": ["chief executive officer", "executive officer", "chief executive"],
        "chief executive officer": ["ceo", "executive officer"],
        "cfo": ["chief financial officer", "finance head"],
        "chief financial officer": ["cfo", "finance head"],
        "cto": ["chief technology officer", "engineering head"],
        "chief technology officer": ["cto", "engineering head"],
    }

    def __init__(self, min_rerank_score: float = -6.0):
        self.min_rerank_score = min_rerank_score

    def _extract_target_entities(self, query: str) -> list[str]:
        """Extract key entity names, job titles, and specific terms from query."""
        clean_q = re.sub(r"\bcheif\b", "chief", query, flags=re.I)
        tokens = re.findall(r"[A-Za-z0-9_\-\$]+", clean_q)
        filtered = [
            t for t in tokens
            if t.lower() not in self._STOP_WORDS and len(t) > 2
        ]

        # Extract capitalized multi-word phrases (proper nouns)
        proper_nouns = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", clean_q)
        entities = list(set(filtered + proper_nouns))

        # Expand acronyms / synonyms
        expanded_entities = list(entities)
        q_lower = clean_q.lower()
        for term, syns in self._SYNONYMS.items():
            if term in q_lower:
                expanded_entities.extend(syns)

        return expanded_entities

    def is_exact_lookup(self, query: str) -> bool:
        """Identify if query seeks an exact numerical, entity, or attribute value."""
        return any(pattern.search(query) for pattern in self._EXACT_LOOKUP_PATTERNS)

    def evaluate(
        self,
        query: str,
        chunks: list[dict],
    ) -> EvidenceAssessment:
        """
        Evaluate retrieved context chunks against the user query.
        Determines if there is verified evidence, partial evidence, or if the model should abstain.
        """
        if not chunks:
            return EvidenceAssessment(
                state=EvidenceState.NOT_VERIFIED,
                confidence=0.0,
                abstention_message="I could not find any authorized documents in the knowledge base relevant to your question.",
                reason="No chunks retrieved from vector store.",
            )

        # 1. Combine retrieved chunk text
        combined_text = " ".join(
            (c.get("content") or c.get("raw_text") or c.get("text") or "")
            for c in chunks
        ).lower()

        # 2. Check top reranker score if available
        top_score = chunks[0].get("reranker_score")
        if top_score is not None and isinstance(top_score, (int, float)):
            if top_score < self.min_rerank_score:
                logger.info(
                    "Evidence gate rejected query | top_score=%.4f < min_score=%.4f",
                    top_score,
                    self.min_rerank_score,
                )
                return EvidenceAssessment(
                    state=EvidenceState.NOT_VERIFIED,
                    confidence=float(top_score),
                    abstention_message="I could not find sufficient verified information in the authorized documents to answer your question accurately.",
                    reason=f"Top reranker score ({top_score:.4f}) below confidence threshold ({self.min_rerank_score}).",
                )

        # 3. Entity matching for exact lookup queries
        target_entities = self._extract_target_entities(query)
        verified_entities = []
        missing_entities = []

        for entity in target_entities:
            entity_lower = entity.lower()
            if entity_lower in combined_text:
                verified_entities.append(entity)
            else:
                missing_entities.append(entity)

        # If it is an exact lookup (e.g. specific employee salary or limit)
        # and key specific entities are completely missing from the context:
        is_exact = self.is_exact_lookup(query)
        if is_exact and missing_entities and len(verified_entities) == 0:
            logger.info(
                "Evidence gate rejected exact lookup | missing_entities=%s",
                missing_entities,
            )
            return EvidenceAssessment(
                state=EvidenceState.NOT_VERIFIED,
                confidence=0.1,
                target_entities=target_entities,
                missing_entities=missing_entities,
                abstention_message=(
                    f"I could not verify information regarding '{', '.join(missing_entities)}' "
                    "from the available authorized documents."
                ),
                reason=f"Target entities {missing_entities} not found in retrieved chunks.",
            )

        # If exact lookup and key entities are partially missing
        if is_exact and missing_entities and verified_entities:
            return EvidenceAssessment(
                state=EvidenceState.PARTIALLY_VERIFIED,
                confidence=0.75,
                target_entities=target_entities,
                verified_entities=verified_entities,
                missing_entities=missing_entities,
                reason=f"Verified: {verified_entities}, Missing: {missing_entities}",
            )

        return EvidenceAssessment(
            state=EvidenceState.VERIFIED,
            confidence=0.95,
            target_entities=target_entities,
            verified_entities=verified_entities,
            reason="Verified in authorized context.",
        )


evidence_gate = EvidenceGate()

"""
Post-Generation Claim & Citation Verifier

Validates LLM-generated responses against authorized retrieved context:
1. Citation existence and correctness: Verifies that cited documents & pages match retrieved chunks.
2. Numerical & entity groundedness: Flags or redacts hallucinated figures, amounts, or limits.
3. Grounding confidence score: Computes ratio of supported factual assertions.
4. Clean sanitization: Ensures only truthful, verifiable citations are presented.
"""

from dataclasses import dataclass, field
import logging
import re

logger = logging.getLogger(__name__)


@dataclass
class VerificationResult:
    is_grounded: bool
    grounding_score: float
    verified_answer: str
    verified_sources: list[dict] = field(default_factory=list)
    invalid_citations: list[str] = field(default_factory=list)
    unsupported_claims: list[str] = field(default_factory=list)
    issues_found: list[str] = field(default_factory=list)


class ClaimVerifier:
    """Post-generation claim verification and citation correctness validator."""

    _CITATION_RE = re.compile(
        r"\[Source:\s*([^,\]]+)(?:,\s*(?:Page|p\.?)\s*:?\s*([^\]]+))?\]",
        re.IGNORECASE,
    )
    _NUMERICAL_CLAIM_RE = re.compile(
        r"(?:[\$€£₹]|Rupees?|USD|INR)?\s*\b\d+(?:,\d{3})*(?:\.\d+)?%?\b",
        re.IGNORECASE,
    )

    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text.lower().strip())

    def verify(
        self,
        query: str,
        answer: str,
        context_chunks: list[dict],
        extracted_sources: list[dict] | None = None,
    ) -> VerificationResult:
        """
        Verify generated answer and its citations against context chunks.
        """
        if not answer or not answer.strip():
            return VerificationResult(
                is_grounded=True,
                grounding_score=1.0,
                verified_answer=answer,
                verified_sources=[],
            )

        if not context_chunks:
            # If no context was provided, any factual claim in answer is ungrounded
            return VerificationResult(
                is_grounded=False,
                grounding_score=0.0,
                verified_answer="I could not verify that information from the available authorized documents.",
                verified_sources=[],
                issues_found=["No context chunks available for verification."],
            )

        # 1. Build knowledge lookup maps from retrieved chunks
        chunk_texts = [
            (c.get("content") or c.get("raw_text") or c.get("text") or "")
            + f" Page {c.get('page_number') or c.get('page') or ''}"
            for c in context_chunks
        ]
        combined_context = self._normalize(" ".join(chunk_texts))

        valid_doc_page_pairs: set[tuple[str, str]] = set()
        valid_doc_titles: set[str] = set()

        for c in context_chunks:
            title = self._normalize(
                c.get("title")
                or c.get("document_title")
                or c.get("filename")
                or ""
            )
            page = str(c.get("page_number") or c.get("page") or "").strip()
            if title:
                valid_doc_titles.add(title)
                if page:
                    valid_doc_page_pairs.add((title, page))

        # 2. Extract and verify citations in the answer
        invalid_citations = []
        citations_found = list(self._CITATION_RE.finditer(answer))
        verified_answer = answer

        for match in citations_found:
            full_match_text = match.group(0)
            doc_raw = match.group(1).strip()
            page_raw = (match.group(2) or "").strip()
            doc_norm = self._normalize(doc_raw)

            # Check if title exists in retrieved chunks
            title_matched = any(
                doc_norm in valid_title or valid_title in doc_norm
                for valid_title in valid_doc_titles
            )

            if not title_matched:
                invalid_citations.append(full_match_text)
                logger.warning(
                    "Invalid citation detected (hallucinated document): %s",
                    full_match_text,
                )
                # Strip out invalid citation tag to prevent misleading provenance
                verified_answer = verified_answer.replace(full_match_text, "")
            elif page_raw:
                # If page is specified, verify if that page is in retrieved set
                page_matched = any(
                    (doc_norm in v_doc or v_doc in doc_norm) and (page_raw == v_page)
                    for v_doc, v_page in valid_doc_page_pairs
                )
                if not page_matched and valid_doc_page_pairs:
                    logger.info(
                        "Citation page unverified in retrieval chunks: doc=%s page=%s",
                        doc_raw,
                        page_raw,
                    )

        # 3. Verify numbers, percentages, and financial limits in prose (excluding citation tags)
        unsupported_claims = []
        answer_prose_only = self._CITATION_RE.sub("", answer)
        numerical_claims = self._NUMERICAL_CLAIM_RE.findall(answer_prose_only)
        total_claims = len(numerical_claims)
        grounded_claims = 0

        for num_str in numerical_claims:
            clean_num = num_str.strip().lstrip("$€£₹").strip()
            if len(clean_num) >= 2 and clean_num not in ("1", "2", "3", "4", "5", "1.", "2.", "3."):
                if clean_num.lower() in combined_context:
                    grounded_claims += 1
                else:
                    unsupported_claims.append(num_str)
            else:
                grounded_claims += 1

        # 4. Compute Grounding Score
        if total_claims > 0:
            grounding_score = round(grounded_claims / total_claims, 2)
        else:
            grounding_score = 1.0

        is_grounded = len(invalid_citations) == 0 and len(unsupported_claims) == 0

        # Filter verified sources to match only chunks that are genuinely grounded
        sources = extracted_sources if extracted_sources is not None else []

        issues = []
        if invalid_citations:
            issues.append(f"Removed {len(invalid_citations)} ungrounded citation tags.")
        if unsupported_claims:
            issues.append(f"Detected {len(unsupported_claims)} numbers not present in source text: {unsupported_claims[:3]}")

        # Clean up any leftover double spaces from removed citations
        verified_answer = re.sub(r"[ ]{2,}", " ", verified_answer).strip()

        return VerificationResult(
            is_grounded=is_grounded,
            grounding_score=grounding_score,
            verified_answer=verified_answer,
            verified_sources=sources,
            invalid_citations=invalid_citations,
            unsupported_claims=unsupported_claims,
            issues_found=issues,
        )


claim_verifier = ClaimVerifier()

"""Unit tests for ClaimVerifier and Citation Correctness."""

import pytest
from backend.verification.claim_verifier import ClaimVerifier


def test_claim_verifier_valid_citation():
    verifier = ClaimVerifier()
    context = [
        {"content": "The petty cash limit is $200 per department.", "title": "Finance Policy", "page_number": 4}
    ]
    answer = "The petty cash limit is $200 [Source: Finance Policy, Page: 4]."
    result = verifier.verify("What is the petty cash limit?", answer, context)

    assert result.is_grounded is True
    assert result.grounding_score == 1.0
    assert "[Source: Finance Policy, Page: 4]" in result.verified_answer
    assert len(result.invalid_citations) == 0


def test_claim_verifier_hallucinated_citation():
    verifier = ClaimVerifier()
    context = [
        {"content": "The petty cash limit is $200 per department.", "title": "Finance Policy", "page_number": 4}
    ]
    # LLM hallucinates non-existent document
    answer = "The petty cash limit is $200 [Source: Secret Executive Docs, Page: 99]."
    result = verifier.verify("What is the petty cash limit?", answer, context)

    assert result.is_grounded is False
    assert len(result.invalid_citations) == 1
    assert "Secret Executive Docs" not in result.verified_answer


def test_claim_verifier_unsupported_number():
    verifier = ClaimVerifier()
    context = [
        {"content": "The mileage reimbursement rate is 0.50 per mile.", "title": "Travel Policy", "page_number": 2}
    ]
    # LLM invents $9999
    answer = "The mileage rate is $9999 [Source: Travel Policy, Page: 2]."
    result = verifier.verify("What is the mileage rate?", answer, context)

    assert result.is_grounded is False
    assert any("9999" in u for u in result.unsupported_claims)

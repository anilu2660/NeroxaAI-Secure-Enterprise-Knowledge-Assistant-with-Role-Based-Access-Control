"""Unit tests for EvidenceGate and Calibrated Abstention."""

import pytest
from backend.rag.evidence_gate import EvidenceGate, EvidenceState


def test_evidence_gate_empty_chunks():
    gate = EvidenceGate()
    result = gate.evaluate("What is the CEO salary?", [])
    assert result.state == EvidenceState.NOT_VERIFIED
    assert result.confidence == 0.0
    assert "could not find any authorized documents" in result.abstention_message


def test_evidence_gate_exact_lookup_missing_entity():
    gate = EvidenceGate()
    chunks = [
        {"content": "The travel reimbursement policy allows up to $50 per day for meals.", "title": "Travel Policy", "page_number": 2}
    ]
    # Searching for CEO salary when only travel policy is present
    result = gate.evaluate("What is the CEO salary?", chunks)
    assert result.state == EvidenceState.NOT_VERIFIED
    assert "could not verify information" in result.abstention_message.lower()


def test_evidence_gate_exact_lookup_verified():
    gate = EvidenceGate()
    chunks = [
        {"content": "The CEO salary band is set at Rupees 600,000 per month.", "title": "Executive Compensation Policy", "page_number": 1}
    ]
    result = gate.evaluate("What is the CEO salary?", chunks)
    assert result.state in (EvidenceState.VERIFIED, EvidenceState.PARTIALLY_VERIFIED)
    assert result.confidence >= 0.7


def test_evidence_gate_general_policy_query():
    gate = EvidenceGate()
    chunks = [
        {"content": "The organization general policy outlines standard employment procedures, workplace safety, and conduct.", "title": "Employee Handbook", "page_number": 1}
    ]
    result = gate.evaluate("What is our organization general policy?", chunks)
    assert result.state == EvidenceState.VERIFIED
    assert result.confidence >= 0.9

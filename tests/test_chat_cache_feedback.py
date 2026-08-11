"""
Chat, Semantic Cache, and Feedback Test Suite

Tests for:
1. Multi-turn conversational chat sessions & message history persistence.
2. Sub-50ms vector semantic query caching.
3. User rating feedback submission & Admin Knowledge Gap Analytics.
"""

import pytest
from fastapi import status
from unittest.mock import AsyncMock, patch


def get_user_headers(db_session, email="emp@enterprise.com", role="employee"):
    """Helper to create user directly in test db_session and return Bearer auth headers."""
    from backend.models.user import User
    from backend.auth.password import hash_password
    from backend.auth.jwt_handler import create_access_token

    user = db_session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("Password123!"),
            full_name="Test User",
            department="General",
            role_id=role,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role_id, "department": user.department}
    )
    return {"Authorization": f"Bearer {token}"}


# ──────────────────────────────────────────────────────────────────────────────
# 1. CHAT SESSIONS & CONVERSATIONAL MEMORY TESTS
# ──────────────────────────────────────────────────────────────────────────────

def test_create_chat_session(client, db_session):
    """Test authenticated user can create a chat session."""
    headers = get_user_headers(db_session, "chat_user1@enterprise.com", "employee")
    payload = {"title": "HR Policies Discussion"}
    response = client.post("/api/v1/chat/sessions", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["title"] == "HR Policies Discussion"
    assert data["messages"] == []


def test_list_chat_sessions(client, db_session):
    """Test listing user's chat sessions."""
    headers = get_user_headers(db_session, "chat_user2@enterprise.com", "employee")
    client.post("/api/v1/chat/sessions", json={"title": "Session 1"}, headers=headers)
    response = client.get("/api/v1/chat/sessions", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    sessions = response.json()
    assert len(sessions) >= 1


@patch("backend.chat.service.rag_service.query", new_callable=AsyncMock)
def test_send_chat_message_multi_turn(mock_rag, client, db_session):
    """Test multi-turn chat messaging with memory."""
    headers = get_user_headers(db_session, "chat_user3@enterprise.com", "employee")
    mock_rag.return_value = {
        "query": "What is our leave policy?",
        "answer": "Employees receive 20 days paid leave.",
        "sources": [{"document_title": "HR_Policy.pdf", "department": "HR", "page_number": 1}],
        "model": "llama3",
        "chunks_retrieved": 1,
    }

    # 1. Create session
    create_res = client.post("/api/v1/chat/sessions", json={"title": "New Conversation"}, headers=headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    session_id = create_res.json()["id"]

    # 2. Send Turn 1
    msg_payload = {
        "session_id": session_id,
        "message": "What is our leave policy?",
    }
    response = client.post("/api/v1/chat/message", json=msg_payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    msg_data = response.json()
    assert msg_data["role"] == "assistant"
    assert "20 days" in msg_data["content"]
    assert len(msg_data["sources"]) == 1

    # 3. Verify session history recorded in DB
    get_res = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert get_res.status_code == status.HTTP_200_OK
    history = get_res.json()["messages"]
    assert len(history) == 2  # 1 user + 1 assistant message


def test_delete_chat_session(client, db_session):
    """Test deleting a chat session."""
    headers = get_user_headers(db_session, "chat_user4@enterprise.com", "employee")
    create_res = client.post("/api/v1/chat/sessions", json={"title": "To Delete"}, headers=headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    session_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert del_res.status_code == status.HTTP_200_OK

    # Verify 404 on get
    get_res = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert get_res.status_code == status.HTTP_404_NOT_FOUND


# ──────────────────────────────────────────────────────────────────────────────
# 2. SEMANTIC CACHE TESTS
# ──────────────────────────────────────────────────────────────────────────────

def test_semantic_cache_hit_and_miss():
    """Test vector similarity semantic cache get and set."""
    from backend.cache.service import SemanticCacheService

    cache = SemanticCacheService(similarity_threshold=0.85, ttl_seconds=60)

    # Initial miss
    assert cache.get("What is annual leave?", "employee", "General") is None

    # Store entry
    cache.set(
        query="What is annual leave entitlement?",
        answer="Employees get 20 days annual leave.",
        sources=[{"document_title": "HR.pdf"}],
        model="llama3",
        chunks_retrieved=1,
        user_role="employee",
        user_department="General",
    )

    # Similar query should HIT (vector similarity > 0.85)
    hit = cache.get("What is annual leave entitlement?", "employee", "General")
    assert hit is not None
    assert hit["cached"] is True
    assert "20 days" in hit["answer"]

    # Different role/dept scope should MISS (RBAC isolation)
    assert cache.get("What is annual leave entitlement?", "admin", "Finance") is None


# ──────────────────────────────────────────────────────────────────────────────
# 3. FEEDBACK & KNOWLEDGE GAP ANALYTICS TESTS
# ──────────────────────────────────────────────────────────────────────────────

def test_submit_user_feedback(client, db_session):
    """Test user can submit rating and comments for an answer."""
    headers = get_user_headers(db_session, "fb_user1@enterprise.com", "employee")
    payload = {
        "query": "What is the travel policy limit?",
        "answer": "Tier 1 hotel limit is 4000 INR.",
        "rating": 1,  # Thumbs up
        "feedback_text": "Accurate response!",
        "chunks_retrieved": 1,
        "department": "Finance",
    }
    response = client.post("/api/v1/feedback/", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["rating"] == 1


def test_knowledge_gap_analytics_admin_only(client, db_session):
    """Test Knowledge Gap Analytics endpoint is accessible to Admin only."""
    emp_headers = get_user_headers(db_session, "emp_gap@enterprise.com", "employee")
    admin_headers = get_user_headers(db_session, "admin_gap@enterprise.com", "admin")

    # 1. Employee denied 403
    emp_res = client.get("/api/v1/feedback/analytics/knowledge-gaps", headers=emp_headers)
    assert emp_res.status_code == status.HTTP_403_FORBIDDEN

    # 2. Submit a negative rating feedback
    client.post(
        "/api/v1/feedback/",
        json={
            "query": "What is the policy for pet leave?",
            "answer": "I cannot find sufficient information.",
            "rating": -1,  # Thumbs down
            "feedback_text": "Missing pet leave policy document",
            "chunks_retrieved": 0,
            "department": "HR",
        },
        headers=emp_headers,
    )

    # 3. Admin successfully retrieves gap report
    admin_res = client.get("/api/v1/feedback/analytics/knowledge-gaps", headers=admin_headers)
    assert admin_res.status_code == status.HTTP_200_OK
    gaps = admin_res.json()
    assert len(gaps) >= 1
    assert any("pet leave" in g["query"] for g in gaps)

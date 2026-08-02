"""
Authentication Integration Tests

Tests for user registration, login, JWT token issuance, and /me user profile endpoints.
"""

from fastapi import status


def test_register_user_success(client):
    """Test registering a new enterprise user."""
    payload = {
        "email": "testuser@enterprise.com",
        "password": "Password123!",
        "full_name": "Test User",
        "department": "Engineering",
        "role": "employee",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "testuser@enterprise.com"
    assert data["role"] == "employee"
    assert data["department"] == "Engineering"


def test_register_duplicate_email_fails(client):
    """Test registering a duplicate email returns HTTP 409 conflict."""
    payload = {
        "email": "duplicate@enterprise.com",
        "password": "Password123!",
        "full_name": "Duplicate User",
    }
    # First registration
    client.post("/api/v1/auth/register", json=payload)

    # Second registration with same email
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_409_CONFLICT


def test_login_success(client):
    """Test logging in with valid credentials returns JWT access token."""
    # Register user first
    register_payload = {
        "email": "loginuser@enterprise.com",
        "password": "Password123!",
        "full_name": "Login User",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    # Login
    login_payload = {
        "email": "loginuser@enterprise.com",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password_fails(client):
    """Test login with wrong password fails with HTTP 401."""
    register_payload = {
        "email": "wrongpwd@enterprise.com",
        "password": "CorrectPassword123!",
        "full_name": "Wrong Pwd User",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_payload = {
        "email": "wrongpwd@enterprise.com",
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

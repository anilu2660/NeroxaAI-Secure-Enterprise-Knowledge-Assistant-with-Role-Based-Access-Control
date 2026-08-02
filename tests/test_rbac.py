"""
RBAC & Permission Tests

Tests for role-based permission enforcement and Admin authorization.
"""

from fastapi import status


def test_list_roles(client, employee_headers):
    """Test authenticated user can list system roles."""
    response = client.get("/api/v1/roles/", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    roles = response.json()
    assert len(roles) >= 6
    role_names = [r["name"].lower() for r in roles]
    assert "admin" in role_names
    assert "employee" in role_names


def test_assign_role_by_admin_success(client, admin_headers):
    """Test Admin can assign role to user."""
    payload = {
        "user_id": "test_usr_123",
        "role": "engineering",
    }
    response = client.post("/api/v1/roles/assign", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "success"
    assert data["assigned_role"] == "engineering"


def test_assign_role_by_employee_denied(client, employee_headers):
    """Test non-admin employee cannot assign roles (HTTP 403 Forbidden)."""
    payload = {
        "user_id": "test_usr_123",
        "role": "admin",
    }
    response = client.post("/api/v1/roles/assign", json=payload, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

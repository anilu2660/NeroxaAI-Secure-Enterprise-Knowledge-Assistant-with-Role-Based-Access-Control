"""
API Integration & End-to-End Tests

Tests for root health check, audit logs, master API router, and user management endpoints.
"""

from fastapi import status


def test_root_health_check(client):
    """Test global application health check endpoint."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert "Enterprise RAG" in data["service"]


def test_get_audit_logs_by_admin(client, admin_headers):
    """Test Admin can retrieve system compliance audit logs."""
    response = client.get("/api/v1/admin/audit-logs/", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    logs = response.json()
    assert isinstance(logs, list)


def test_get_audit_logs_by_employee_denied(client, employee_headers):
    """Test non-admin employee cannot access audit logs (HTTP 403 Forbidden)."""
    response = client.get("/api/v1/admin/audit-logs/", headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_list_users_by_admin(client, admin_headers):
    """Test Admin can list all registered enterprise users."""
    response = client.get("/api/v1/users/", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    users = response.json()
    assert isinstance(users, list)


def test_list_users_by_employee_denied(client, employee_headers):
    """Test non-admin employee cannot list users (HTTP 403 Forbidden)."""
    response = client.get("/api/v1/users/", headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

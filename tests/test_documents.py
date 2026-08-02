"""
Document Upload & Ingestion Tests

Tests for file extension validation, size validation, upload, and deletion.
"""

from fastapi import status


def test_upload_invalid_extension_fails(client, admin_headers):
    """Test uploading unsupported file format (.exe) fails with HTTP 400."""
    files = {"file": ("malicious.exe", b"binary content", "application/octet-stream")}
    data = {"department": "General"}

    response = client.post("/api/v1/documents/upload", files=files, data=data, headers=admin_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_empty_file_fails(client, admin_headers):
    """Test uploading 0-byte empty file fails with HTTP 400."""
    files = {"file": ("empty.txt", b"", "text/plain")}
    data = {"department": "General"}

    response = client.post("/api/v1/documents/upload", files=files, data=data, headers=admin_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Uploaded file is empty" in response.json()["detail"]


def test_upload_by_employee_denied(client, employee_headers):
    """Test non-admin employee uploading document fails with HTTP 403 Forbidden."""
    files = {"file": ("test.txt", b"Hello text content", "text/plain")}
    data = {"department": "General"}

    response = client.post("/api/v1/documents/upload", files=files, data=data, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

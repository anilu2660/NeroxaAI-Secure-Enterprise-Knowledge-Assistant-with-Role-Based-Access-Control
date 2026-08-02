"""
Document Routes

API endpoints for document upload, ingestion, and management.
"""

import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from backend.documents.schemas import DocumentUploadResponse, ShareDocumentRequest
from backend.documents.service import document_service

from backend.roles.middleware import require_permission, get_current_user_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload and ingest document",
    description=(
        "Upload a PDF, DOCX, or TXT document. "
        "Requires 'upload' permission (Admin, HR, Finance, Engineering, Sales)."
    ),
)
async def upload_document(
    file: UploadFile = File(...),
    department: str = Form("General"),
    user_role: str = Header(default="employee", alias="X-User-Role"),
):
    """
    Ingest enterprise document into vector database.
    Requires 'upload' permission.
    """
    # Enforce RBAC permission check for Upload
    from backend.roles.service import role_service
    if not role_service.has_permission(user_role, "upload"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Role '{user_role}' does not have upload permission.",
        )

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        result = await document_service.ingest_document(
            filename=file.filename,
            file_bytes=file_bytes,
            department=department,
            owner=user_role,
        )

        return DocumentUploadResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error("Document ingestion failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and ingest document: {str(e)}",
        ) from e


@router.post(
    "/{document_id}/share",
    summary="Share document with specific users or employees",
    description="Grant explicit document access to specific users/employees. Requires 'share' permission (Admin, HR, Finance, Engineering, Sales).",
)
async def share_document(
    document_id: str,
    request: ShareDocumentRequest,
    user_role: str = Header(default="employee", alias="X-User-Role"),
):
    """
    Share document with specific users/employees.
    """
    from backend.roles.service import role_service
    if not role_service.has_permission(user_role, "share"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Role '{user_role}' does not have share permission.",
        )

    success = await document_service.share_document(document_id, request.user_ids)
    return {
        "status": "shared",
        "document_id": document_id,
        "shared_with": request.user_ids,
        "success": success,
    }


@router.delete(
    "/{document_id}",
    summary="Delete document from vector DB",
)
async def delete_document(
    document_id: str,
    user_role: str = Header(default="employee", alias="X-User-Role"),
):
    """
    Remove all vector chunks for a document from Qdrant.
    Requires 'delete' permission (Admin).
    """
    from backend.roles.service import role_service
    if not role_service.has_permission(user_role, "delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Role '{user_role}' does not have delete permission.",
        )

    success = await document_service.delete_document(document_id)
    return {"status": "deleted", "document_id": document_id, "success": success}

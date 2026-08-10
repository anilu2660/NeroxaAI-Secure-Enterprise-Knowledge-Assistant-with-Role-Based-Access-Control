"""
Document Routes

API endpoints for document upload, ingestion, and management.
"""

import logging
from fastapi import APIRouter, UploadFile, File, Form, Header, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database.session import get_db
from backend.documents.schemas import DocumentUploadResponse, ShareDocumentRequest
from backend.documents.service import document_service
from backend.roles.middleware import require_permission
from backend.audit.service import audit_service
from backend.audit.schemas import AuditLogCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}


from backend.utils.rate_limiter import rate_limit_guard

from backend.api.dependencies import get_current_user
from backend.models.user import User

@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload and ingest document",
    description=(
        "Upload a PDF, DOCX, or TXT document. "
        "Requires 'upload' permission (Admin, HR, Finance, Engineering, Sales)."
    ),
    dependencies=[Depends(rate_limit_guard("upload"))],
)
async def upload_document(
    file: UploadFile = File(...),
    department: str = Form("General"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ingest enterprise document into vector database.
    Requires 'upload' permission.
    """
    user_role = current_user.role_id
    from backend.roles.service import role_service
    if not role_service.has_permission(user_role, "upload"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Role '{user_role}' does not have upload permission.",
        )

    # 1. Validate File Extension
    ext = file.filename.lower().split(".")[-1] if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        # 2. Validate File Size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            )

        result = await document_service.ingest_document(
            filename=file.filename,
            file_bytes=file_bytes,
            department=department,
            owner=current_user.email,
            owner_id=current_user.id,
            db=db,
        )

        # 3. Audit Log Event
        audit_service.log_event(
            db=db,
            event_data=AuditLogCreate(
                event_type="document_uploaded",
                user_id=current_user.id,
                user_email=current_user.email,
                user_role=user_role,
                action=f"Uploaded document '{file.filename}' to department '{department}'",
                resource=result["document_id"],
                details={"chunks": result["chunks_created"], "size": len(file_bytes)},
            ),
        )

        return DocumentUploadResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),  # ValueError messages are safe — they are application-controlled
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        # SECURITY: Log full error internally but return a generic message to the client.
        # Never expose stack traces, internal paths, or library details externally.
        logger.error("Document ingestion failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document processing failed. Please try again or contact your administrator.",
        ) from e


@router.post(
    "/{document_id}/share",
    summary="Share document with specific users or employees",
    description="Grant explicit document access to specific users/employees. Requires 'share' permission (Admin, HR, Finance, Engineering, Sales).",
)
async def share_document(
    document_id: str,
    request: ShareDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Share document with specific users/employees.
    """
    user_role = current_user.role_id
    from backend.roles.service import role_service
    if not role_service.has_permission(user_role, "share"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Role '{user_role}' does not have share permission.",
        )

    success = await document_service.share_document(document_id, request.user_ids, db=db)

    # Audit Log Event
    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="document_shared",
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=user_role,
            action=f"Shared document '{document_id}' with users {request.user_ids}",
            resource=document_id,
        ),
    )

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove all vector chunks for a document from Qdrant.
    Requires 'delete' permission (Admin).
    """
    user_role = current_user.role_id
    from backend.roles.service import role_service
    if not role_service.has_permission(user_role, "delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access DENIED. Role '{user_role}' does not have delete permission.",
        )

    success = await document_service.delete_document(document_id, db=db)

    # Audit Log Event
    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="document_deleted",
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=user_role,
            action=f"Deleted document '{document_id}'",
            resource=document_id,
        ),
    )

    return {"status": "deleted", "document_id": document_id, "success": success}

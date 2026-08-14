import logging
import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.api.dependencies import get_current_user
from backend.audit.schemas import AuditLogCreate
from backend.audit.service import audit_service
from backend.authorization.service import authorization_service
from backend.config import settings
from backend.database.session import get_db
from backend.documents.schemas import DocumentUploadResponse, ShareDocumentRequest
from backend.documents.security import validate_upload
from backend.documents.service import document_service
from backend.models.document import Document
from backend.models.user import User
from backend.retriever.service import retriever_service
from backend.utils.rate_limiter import rate_limit_guard

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload and ingest document",
    dependencies=[Depends(rate_limit_guard("upload"))],
)
async def upload_document(
    file: UploadFile = File(...),
    department: str = Form("General"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    department = department.strip()
    filename = (file.filename or "").strip()

    authorization_service.require_upload_permission(
        current_user,
        department,
    )

    try:
        file_bytes = await file.read()
        safe_filename, detected_mime = validate_upload(
            filename,
            file_bytes,
        )

        result = await document_service.ingest_document(
            filename=safe_filename,
            file_bytes=file_bytes,
            department=department,
            owner=current_user.email,
            owner_id=current_user.id,
            mime_type=detected_mime,
            db=db,
        )

        event_type = (
            "document_skipped_duplicate"
            if result.get("status") == "already_exists"
            else "document_uploaded"
        )

        action = (
            f"Upload skipped — '{safe_filename}' already indexed in '{department}'"
            if event_type == "document_skipped_duplicate"
            else f"Uploaded document '{safe_filename}' to department '{department}'"
        )

        audit_service.log_event(
            db=db,
            event_data=AuditLogCreate(
                event_type=event_type,
                user_id=current_user.id,
                user_email=current_user.email,
                user_role=current_user.role_id,
                action=action,
                resource=result["document_id"],
                details={
                    "chunks": result["chunks_created"],
                    "size": len(file_bytes),
                    "mime_type": detected_mime,
                },
            ),
        )

        return DocumentUploadResponse(**result)

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Document ingestion failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document processing failed. Please try again or contact your administrator.",
        ) from exc


@router.get(
    "/",
    summary="List indexed documents",
)
def list_documents(
    department: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document).filter(Document.status == "indexed")

    if department:
        query = query.filter(Document.department == department.strip())

    documents = query.order_by(Document.created_at.desc()).all()

    visible_documents = [
        document
        for document in documents
        if authorization_service.can_access_document(
            current_user,
            document,
        )
    ]

    return [
        {
            "document_id": document.id,
            "title": document.title,
            "filename": document.filename,
            "department": document.department,
            "total_chunks": document.total_chunks,
            "status": document.status,
            "created_at": (
                document.created_at.isoformat()
                if document.created_at
                else None
            ),
        }
        for document in visible_documents
    ]


@router.post(
    "/{document_id}/share",
    summary="Share document with specific users",
)
async def share_document(
    document_id: str,
    request: ShareDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    authorization_service.require_share_permission(
        current_user,
        document,
    )

    success = await document_service.share_document(
        document_id,
        request.user_ids,
        db=db,
    )

    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="document_shared",
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role_id,
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
    summary="Delete document",
)
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    authorization_service.require_delete_permission(
        current_user,
        document,
    )

    success = await document_service.delete_document(
        document_id,
        db=db,
    )

    audit_service.log_event(
        db=db,
        event_data=AuditLogCreate(
            event_type="document_deleted",
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role_id,
            action=f"Deleted document '{document_id}'",
            resource=document_id,
        ),
    )

    return {
        "status": "deleted",
        "document_id": document_id,
        "success": success,
    }


@router.get(
    "/{document_id}/preview",
    summary="Get document preview and content",
)
def get_document_preview(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )

    authorization_service.require_document_access(
        current_user,
        document,
    )

    content_data = retriever_service.get_document_content(
        document_id,
    )

    filename = document.filename
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    storage_path = os.path.join(
        "uploaded_files",
        f"{document_id}.{extension}",
    )
    legacy_pdf_path = os.path.join(
        "uploaded_files",
        f"{document_id}.pdf",
    )
    legacy_named_path = os.path.join(
        "uploaded_files",
        f"{document_id}_{filename}",
    )
    docs_path = os.path.join("docs", filename)

    has_raw = any(
        os.path.exists(path) and os.path.isfile(path)
        for path in [storage_path, legacy_pdf_path, legacy_named_path, docs_path]
    )

    ext = extension.upper() if extension else "UNKNOWN"

    return {
        "document_id": document.id,
        "title": document.title,
        "filename": document.filename,
        "department": document.department,
        "file_size": document.file_size,
        "mime_type": document.mime_type,
        "kind": ext,
        "total_chunks": document.total_chunks,
        "has_raw": has_raw,
        "raw_url": f"/api/v1/documents/{document.id}/raw",
        "created_at": (
            document.created_at.isoformat()
            if document.created_at
            else None
        ),
        "chunks": content_data.get("chunks", []),
    }


@router.get(
    "/{document_id}/raw",
    summary="Serve raw document binary",
)
def get_raw_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    authorization_service.require_document_access(
        current_user,
        document,
    )

    filename = document.filename
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    paths_to_check = [
        os.path.join("uploaded_files", f"{document_id}.{extension}"),
        os.path.join("uploaded_files", f"{document_id}.pdf"),
        os.path.join("uploaded_files", f"{document_id}_{filename}"),
        os.path.join("docs", filename),
    ]

    for path in paths_to_check:
        if os.path.exists(path) and os.path.isfile(path):
            mime = document.mime_type or "application/octet-stream"
            return FileResponse(
                path=path,
                media_type=mime,
                filename=filename,
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Raw document binary file not found.",
    )

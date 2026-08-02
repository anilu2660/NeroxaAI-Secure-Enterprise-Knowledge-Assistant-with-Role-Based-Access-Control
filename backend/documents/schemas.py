"""
Document Schemas

Pydantic models for document ingestion and metadata payloads.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""

    document_id: str = Field(..., description="Unique UUID for the uploaded document.")
    title: str = Field(..., description="Original filename/title of document.")
    department: str = Field(..., description="Target department for RBAC access control.")
    chunks_created: int = Field(..., description="Total vector chunks generated and indexed in Qdrant.")
    status: str = Field(default="ingested", description="Processing status.")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ShareDocumentRequest(BaseModel):
    """Schema for sharing document with users/employees."""

    user_ids: list[str] = Field(..., description="List of user IDs, employee IDs, or roles to grant document access to.")


class DocumentInfo(BaseModel):
    """Schema for document metadata item."""

    document_id: str
    title: str
    department: str
    owner: str
    uploaded_at: datetime

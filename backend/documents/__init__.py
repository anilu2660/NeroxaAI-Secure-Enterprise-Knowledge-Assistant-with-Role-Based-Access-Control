"""
Documents Module

Handles document upload, text extraction, chunking, embedding generation,
and Qdrant vector storage with RBAC metadata payload.
"""

from backend.documents.service import DocumentService, document_service
from backend.documents.parser import DocumentParser, document_parser
from backend.documents.chunker import DocumentChunker, document_chunker
from backend.documents.schemas import DocumentUploadResponse, DocumentInfo

__all__ = [
    "DocumentService",
    "document_service",
    "DocumentParser",
    "document_parser",
    "DocumentChunker",
    "document_chunker",
    "DocumentUploadResponse",
    "DocumentInfo",
]

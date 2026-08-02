"""
Retriever Module

Handles metadata-filtered semantic search against the Qdrant vector database.
Enforces RBAC by filtering results based on user role and department permissions.
Provides Qdrant collection management and document chunk vector storage.
"""

from backend.retriever.service import RetrieverService, retriever_service
from backend.retriever.qdrant_client import QdrantManager, qdrant_manager

__all__ = [
    "RetrieverService",
    "retriever_service",
    "QdrantManager",
    "qdrant_manager",
]

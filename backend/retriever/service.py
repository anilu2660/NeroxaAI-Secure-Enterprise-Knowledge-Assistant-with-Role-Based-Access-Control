"""
Retriever Service

Performs semantic search with metadata filtering against Qdrant.
Enforces RBAC before returning relevant document chunks.

RBAC Rules:
- Admin: Can access all documents across all departments
- Department roles (HR, Finance, Engineering, Sales): Can access their own
  department's documents plus documents tagged as "General"
- Employee: Can only access documents tagged as "General" or explicitly shared
"""

import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny, PointStruct
from backend.config import settings
from backend.retriever.qdrant_client import qdrant_manager

logger = logging.getLogger(__name__)

# RBAC role-to-department access mapping
ROLE_ACCESS_MAP = {
    "admin": None,  # None means access to ALL departments
    "hr": ["HR", "General"],
    "finance": ["Finance", "General"],
    "engineering": ["Engineering", "General"],
    "sales": ["Sales", "General"],
    "employee": ["General"],
}


class RetrieverService:
    """
    Service for RBAC-aware semantic search against Qdrant vector database.

    Retrieves relevant document chunks by combining vector similarity
    with metadata filtering based on the user's role and department.
    Also handles chunk indexing and document deletion.
    """

    def __init__(self):
        """Initialize the Qdrant client and manager."""
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.collection = settings.QDRANT_COLLECTION
        self.manager = qdrant_manager

    @property
    def client(self) -> QdrantClient:
        """Access the underlying Qdrant client."""
        return self.manager.client

    def _build_rbac_filter(
        self,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
    ) -> Filter | None:
        """
        Build a Qdrant metadata filter based on user's RBAC permissions.

        Args:
            user_role: The user's role (admin, hr, finance, etc.)
            user_department: The user's department.
            department_filter: Optional additional department filter from query.

        Returns:
            Qdrant Filter object or None (for admin with no extra filter).
        """
        role_lower = user_role.lower()
        allowed_departments = ROLE_ACCESS_MAP.get(role_lower, ["General"])

        # Admin with no department filter => no restrictions
        if allowed_departments is None and department_filter is None:
            return None

        # Admin with department filter => filter by requested department only
        if allowed_departments is None and department_filter:
            return Filter(
                must=[
                    FieldCondition(
                        key="department",
                        match=MatchValue(value=department_filter),
                    )
                ]
            )

        # Non-admin: restrict to allowed departments
        # If a department_filter is specified, intersect with allowed departments
        if department_filter:
            if department_filter in allowed_departments:
                target_departments = [department_filter]
            else:
                logger.warning(
                    "User role '%s' cannot access department '%s'",
                    user_role,
                    department_filter,
                )
                # Return an impossible filter to yield zero results
                target_departments = ["__NONE__"]
        else:
            target_departments = allowed_departments

        return Filter(
            should=[
                FieldCondition(
                    key="department",
                    match=MatchAny(any=target_departments),
                ),
                FieldCondition(
                    key="shared_with",
                    match=MatchValue(value=user_role.lower()),
                ),
            ]
        )

    async def search(
        self,
        query_embedding: list[float],
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        """
        Search for relevant document chunks with RBAC enforcement.

        Args:
            query_embedding: The embedded query vector.
            user_role: User's role for RBAC filtering.
            user_department: User's department for RBAC filtering.
            department_filter: Optional department to narrow results.
            top_k: Number of top results to return.

        Returns:
            List of dicts with keys: content, title, department, page_number, score.
        """
        self.manager.ensure_collection_exists()
        
        rbac_filter = self._build_rbac_filter(
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
        )

        try:
            response = self.client.query_points(
                collection_name=self.collection,
                query=query_embedding,
                query_filter=rbac_filter,
                limit=top_k,
            )
            results = response.points

            chunks = []
            for point in results:
                payload = point.payload or {}
                chunks.append({
                    "content": payload.get("content", ""),
                    "title": payload.get("title", "Unknown Document"),
                    "department": payload.get("department", "General"),
                    "page_number": payload.get("page_number", "N/A"),
                    "document_id": payload.get("document_id", ""),
                    "owner": payload.get("owner", ""),
                    "score": point.score,
                })

            logger.info(
                "Retrieved %d chunks | role=%s | filter=%s",
                len(chunks),
                user_role,
                department_filter,
            )
            return chunks

        except Exception as e:
            logger.error("Vector search failed: %s", str(e))
            raise RuntimeError(f"Retrieval failed: {str(e)}") from e

    async def index_chunks(self, points: list[PointStruct]) -> bool:
        """
        Store embedded document chunk points in Qdrant with metadata payload.

        Args:
            points: List of PointStruct objects (id, vector, payload).
        """
        return self.manager.upsert_chunks(points)

    async def share_document(self, document_id: str, user_ids: list[str]) -> bool:
        """
        Share document with specific users/roles so they can access it in RAG queries.
        """
        return self.manager.share_document_with_users(document_id, user_ids)

    async def delete_document_chunks(self, document_id: str) -> bool:
        """
        Delete all vector chunks belonging to a document from Qdrant.

        Args:
            document_id: The ID of the document to remove.
        """
        return self.manager.delete_by_document_id(document_id)

    async def check_health(self) -> dict:
        """
        Check Qdrant connectivity and collection status.

        Returns:
            dict with status, host, and collection info.
        """
        try:
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]
            collection_exists = self.collection in collection_names

            return {
                "status": "healthy",
                "host": f"{self.host}:{self.port}",
                "target_collection": self.collection,
                "collection_exists": collection_exists,
                "collections": collection_names,
            }
        except Exception as e:
            logger.error("Qdrant health check failed: %s", str(e))
            return {
                "status": "unhealthy",
                "host": f"{self.host}:{self.port}",
                "error": str(e),
            }


# Singleton instance for dependency injection
retriever_service = RetrieverService()

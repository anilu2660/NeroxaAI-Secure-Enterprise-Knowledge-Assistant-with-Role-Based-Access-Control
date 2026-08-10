"""
Qdrant Client Manager

Manages vector database connection, collection creation, indexing configuration,
and vector CRUD operations against Qdrant.
"""

import logging
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    PayloadSchemaType,
    SparseVectorParams,
    SparseIndexParams,
)
from backend.config import settings

logger = logging.getLogger(__name__)


class QdrantManager:
    """
    Manages Qdrant vector database lifecycle and point operations.
    """

    def __init__(self):
        """Initialize Qdrant client connection."""
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.url = settings.QDRANT_URL
        self.api_key = settings.QDRANT_API_KEY
        self.collection_name = settings.QDRANT_COLLECTION
        self.vector_size = settings.EMBEDDING_DIMENSION
        self._client = None

    @property
    def client(self) -> QdrantClient:
        """Lazy-loaded Qdrant client instance (supports Qdrant Cloud & local)."""
        if self._client is None:
            if self.url and self.api_key:
                logger.info("Connecting to Qdrant Cloud at %s", self.url)
                self._client = QdrantClient(
                    url=self.url,
                    api_key=self.api_key,
                    prefer_grpc=False,
                    timeout=30,
                    check_compatibility=False,
                )
            elif self.url:
                logger.info("Connecting to Qdrant at %s", self.url)
                self._client = QdrantClient(
                    url=self.url,
                    prefer_grpc=False,
                    timeout=30,
                    check_compatibility=False,
                )
            else:
                if self.host == ":memory:":
                    logger.info("Connecting to local in-memory Qdrant")
                    self._client = QdrantClient(location=":memory:")
                else:
                    logger.info("Connecting to local Qdrant at %s:%d", self.host, self.port)
                    self._client = QdrantClient(
                        host=self.host,
                        port=self.port,
                        prefer_grpc=False,
                        timeout=30,
                        check_compatibility=False,
                    )
        return self._client

    def ensure_collection_exists(self) -> bool:
        """
        Check if the target collection exists. If not, create it with named vectors ('dense' & 'sparse').
        Also configures payload indices for RBAC filtering fields.
        """
        try:
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]

            if self.collection_name not in collection_names:
                logger.info(
                    "Collection '%s' does not exist. Creating with named vectors (dense size=%d, sparse)...",
                    self.collection_name,
                    self.vector_size,
                )
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config={
                        "dense": VectorParams(
                            size=self.vector_size,
                            distance=Distance.COSINE,
                        )
                    },
                    sparse_vectors_config={
                        "sparse": SparseVectorParams(
                            index=SparseIndexParams(
                                on_disk=False,
                            )
                        )
                    },
                )
                logger.info("Collection '%s' created successfully with hybrid vectors schema.", self.collection_name)

                # Create payload indices for fast RBAC metadata filtering
                self._create_payload_indices()
                return True

            logger.debug("Collection '%s' already exists.", self.collection_name)
            return True

        except Exception as e:
            logger.error("Failed to ensure collection exists: %s", str(e))
            raise RuntimeError(f"Qdrant collection error: {str(e)}") from e

    def _create_payload_indices(self):
        """Create payload index on department and role fields for metadata filtering."""
        try:
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="department",
                field_schema=PayloadSchemaType.KEYWORD,
            )
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="role",
                field_schema=PayloadSchemaType.KEYWORD,
            )
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="document_id",
                field_schema=PayloadSchemaType.KEYWORD,
            )
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="shared_with",
                field_schema=PayloadSchemaType.KEYWORD,
            )
            logger.info("Payload indices created for department, role, document_id, shared_with")
        except Exception as e:
            logger.warning("Could not create payload indices: %s", str(e))

    def upsert_chunks(self, points: list[PointStruct]) -> bool:
        """
        Upsert (insert/update) a list of document chunk points into Qdrant.

        Args:
            points: List of PointStruct objects containing id, vector, and payload.

        Returns:
            True if successful.
        """
        self.ensure_collection_exists()

        try:
            operation_info = self.client.upsert(
                collection_name=self.collection_name,
                points=points,
            )
            logger.info(
                "Successfully upserted %d points into '%s' | status=%s",
                len(points),
                self.collection_name,
                operation_info.status,
            )
            return True
        except Exception as e:
            logger.error("Failed to upsert points: %s", str(e))
            raise RuntimeError(f"Upsert points failed: {str(e)}") from e

    def delete_by_document_id(self, document_id: str) -> bool:
        """
        Delete all vector chunks associated with a specific document_id.

        Args:
            document_id: Unique ID of the document to remove.

        Returns:
            True if successful.
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
            )
            logger.info("Deleted chunks for document_id='%s'", document_id)
            return True
        except Exception as e:
            logger.error("Failed to delete points for document '%s': %s", document_id, str(e))
            raise RuntimeError(f"Delete document chunks failed: {str(e)}") from e

    def share_document_with_users(self, document_id: str, user_ids: list[str]) -> bool:

        """
        Set or update the 'shared_with' payload array for all chunks of a document.
        Allows Admin to grant document access directly to specific employees/users.

        Args:
            document_id: UUID of the document.
            user_ids: List of user/employee IDs or usernames granted access.
        """
        try:
            self.client.set_payload(
                collection_name=self.collection_name,
                payload={"shared_with": user_ids},
                points=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
            )
            logger.info("Shared document_id='%s' with users: %s", document_id, user_ids)
            return True
        except Exception as e:
            logger.error("Failed to share document '%s': %s", document_id, str(e))
            raise RuntimeError(f"Share document failed: {str(e)}") from e


# Singleton instance
qdrant_manager = QdrantManager()

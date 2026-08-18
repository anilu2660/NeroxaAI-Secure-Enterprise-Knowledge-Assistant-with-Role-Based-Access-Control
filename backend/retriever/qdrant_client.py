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
    Modifier,
)
from backend.config import settings

logger = logging.getLogger(__name__)


class QdrantManager:
    def __init__(self):
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.url = settings.QDRANT_URL
        self.api_key = settings.QDRANT_API_KEY
        self.collection_name = settings.QDRANT_COLLECTION
        self.vector_size = settings.EMBEDDING_DIMENSION
        self._client = None

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            if self.url:
                logger.info("Initializing Qdrant client with cloud URL: %s", self.url)
                self._client = QdrantClient(
                    url=self.url,
                    api_key=self.api_key if self.api_key else None,
                    prefer_grpc=False,
                    timeout=30,
                    check_compatibility=False,
                )
            else:
                if self.host == ":memory:":
                    self._client = QdrantClient(location=":memory:")
                elif self.host and self.host != "local":
                    try:
                        client = QdrantClient(
                            host=self.host,
                            port=self.port,
                            prefer_grpc=False,
                            timeout=3,
                            check_compatibility=False,
                        )
                        client.get_collections()
                        self._client = client
                    except Exception:
                        logger.info(
                            "Qdrant server at %s:%s not reachable, using local storage './qdrant_storage'",
                            self.host,
                            self.port,
                        )
                        self._client = QdrantClient(path="./qdrant_storage")
                else:
                    self._client = QdrantClient(path="./qdrant_storage")
        return self._client

    def ensure_collection_exists(self) -> bool:
        try:
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]

            if self.collection_name not in collection_names:
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
                            modifier=Modifier.IDF,
                            index=SparseIndexParams(on_disk=False),
                        )
                    },
                )
                self._create_payload_indices()
                return True

            return True

        except Exception as e:
            logger.error("Failed to ensure collection exists: %s", str(e))
            raise RuntimeError(f"Qdrant collection error: {str(e)}") from e

    def _create_payload_indices(self):
        fields = {
            "department": PayloadSchemaType.KEYWORD,
            "role": PayloadSchemaType.KEYWORD,
            "document_id": PayloadSchemaType.KEYWORD,
            "shared_with": PayloadSchemaType.KEYWORD,
            "owner_id": PayloadSchemaType.KEYWORD,
        }

        for field_name, field_schema in fields.items():
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=field_schema,
                )
            except Exception as e:
                logger.warning(
                    "Could not create payload index for '%s': %s",
                    field_name,
                    str(e),
                )

    def upsert_chunks(self, points: list[PointStruct]) -> bool:
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
            return True
        except Exception as e:
            logger.error(
                "Failed to delete points for document '%s': %s",
                document_id,
                str(e),
            )
            raise RuntimeError(f"Delete document chunks failed: {str(e)}") from e

    def share_document_with_users(
        self,
        document_id: str,
        user_ids: list[str],
    ) -> bool:
        try:
            self.client.set_payload(
                collection_name=self.collection_name,
                payload={"shared_with": list(set(user_ids))},
                points=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
            )
            return True
        except Exception as e:
            logger.error(
                "Failed to share document '%s': %s",
                document_id,
                str(e),
            )
            raise RuntimeError(f"Share document failed: {str(e)}") from e

    def has_document_chunks(self, document_id: str) -> bool:
        try:
            self.ensure_collection_exists()
            res = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
                limit=1,
            )
            points, _ = res
            return len(points) > 0
        except Exception as e:
            logger.warning(
                "Error checking vector points for document '%s': %s",
                document_id,
                str(e),
            )
            return False

    def find_existing_document_id(self, title: str, department: str) -> str | None:
        try:
            self.ensure_collection_exists()
            res = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="title",
                            match=MatchValue(value=title),
                        ),
                        FieldCondition(
                            key="department",
                            match=MatchValue(value=department),
                        ),
                    ]
                ),
                limit=1,
            )
            points, _ = res
            if points and points[0].payload:
                return points[0].payload.get("document_id")
            return None
        except Exception as e:
            logger.warning(
                "Error finding existing document for title '%s' in '%s': %s",
                title,
                department,
                str(e),
            )
            return None

    def get_document_content(self, document_id: str) -> dict:
        try:
            self.ensure_collection_exists()
            res = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        )
                    ],
                ),
                limit=500,
                with_payload=True,
                with_vectors=False,
            )
            points, _ = res
            chunks = [p.payload for p in points if p.payload]
            chunks.sort(
                key=lambda c: (
                    c.get("page_number", 1),
                    c.get("chunk_index", 0),
                )
            )
            return {
                "document_id": document_id,
                "total_chunks": len(chunks),
                "chunks": chunks,
            }
        except Exception as e:
            logger.warning(
                "Error getting vector content for document '%s': %s",
                document_id,
                str(e),
            )
            return {
                "document_id": document_id,
                "total_chunks": 0,
                "chunks": [],
            }

    def purge_orphaned_chunks(self, valid_document_ids: set[str]) -> int:
        try:
            self.ensure_collection_exists()
            res = self.client.scroll(
                collection_name=self.collection_name,
                limit=10000,
                with_payload=True,
                with_vectors=False,
            )
            points, _ = res
            orphaned_point_ids = []
            for p in points:
                doc_id = (p.payload or {}).get("document_id")
                if not doc_id or doc_id not in valid_document_ids:
                    orphaned_point_ids.append(p.id)
            if orphaned_point_ids:
                from qdrant_client.models import PointIdsList
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=PointIdsList(points=orphaned_point_ids),
                )
                logger.info("Purged %d orphaned points from Qdrant.", len(orphaned_point_ids))
            return len(orphaned_point_ids)
        except Exception as e:
            logger.error("Failed to purge orphaned chunks: %s", str(e))
            return 0


qdrant_manager = QdrantManager()

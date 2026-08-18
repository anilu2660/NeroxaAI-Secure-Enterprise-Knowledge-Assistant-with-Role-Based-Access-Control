"""
Retriever Service

Performs semantic search with metadata filtering against Qdrant.
Enforces RBAC before returning relevant document chunks.
"""

import logging
from typing import Any
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny, PointStruct
from backend.config import settings
from backend.retriever.qdrant_client import qdrant_manager

logger = logging.getLogger(__name__)

ROLE_ACCESS_MAP = {
    "admin": None,
    "hr": {"HR", "General"},
    "finance": {"Finance", "General"},
    "engineering": {"Engineering", "General"},
    "sales": {"Sales", "General"},
    "employee": {"General"},
}


class RetrieverService:
    def __init__(self):
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.collection = settings.QDRANT_COLLECTION
        self.manager = qdrant_manager

    @property
    def client(self) -> QdrantClient:
        return self.manager.client

    def _build_rbac_filter(
        self,
        user_role: str,
        user_department: str,
        user_id: str,
        department_filter: str | None = None,
    ) -> Filter | None:
        role_lower = (user_role or "").strip().lower()
        user_dept = (user_department or "").strip()
        user_id = (user_id or "").strip()

        if not user_id:
            raise ValueError("Authenticated user ID is required for RAG retrieval.")

        if role_lower == "admin":
            if department_filter:
                return Filter(
                    must=[
                        FieldCondition(
                            key="department",
                            match=MatchValue(value=department_filter),
                        )
                    ]
                )
            return None

        allowed_departments = set(
            ROLE_ACCESS_MAP.get(role_lower, {"General"}) or {"General"}
        )
        if user_dept:
            allowed_departments.add(user_dept)

        access_conditions = [
            FieldCondition(
                key="department",
                match=MatchAny(any=list(allowed_departments)),
            ),
            FieldCondition(
                key="owner_id",
                match=MatchValue(value=user_id),
            ),
            FieldCondition(
                key="shared_with",
                match=MatchValue(value=user_id),
            ),
        ]

        must_conditions = [Filter(should=access_conditions)]

        if department_filter:
            if department_filter not in allowed_departments:
                must_conditions = [
                    Filter(
                        should=[
                            FieldCondition(
                                key="owner_id",
                                match=MatchValue(value=user_id),
                            ),
                            FieldCondition(
                                key="shared_with",
                                match=MatchValue(value=user_id),
                            ),
                        ]
                    ),
                    Filter(
                        must=[
                            FieldCondition(
                                key="department",
                                match=MatchValue(value=department_filter),
                            )
                        ]
                    ),
                ]
            else:
                must_conditions.append(
                    Filter(
                        must=[
                            FieldCondition(
                                key="department",
                                match=MatchValue(value=department_filter),
                            )
                        ]
                    )
                )

        return Filter(must=must_conditions)

    async def search(
        self,
        query_embedding: list[float],
        user_role: str,
        user_department: str,
        user_id: str,
        department_filter: str | None = None,
        top_k: int = 6,
        query_text: str | None = None,
    ) -> list[dict]:
        self.manager.ensure_collection_exists()

        rbac_filter = self._build_rbac_filter(
            user_role=user_role,
            user_department=user_department,
            user_id=user_id,
            department_filter=department_filter,
        )

        try:
            dense_results = []
            limit = top_k * 3 if query_text and settings.ENABLE_HYBRID_SEARCH else top_k

            try:
                response = self.client.query_points(
                    collection_name=self.collection,
                    query=query_embedding,
                    using="dense",
                    query_filter=rbac_filter,
                    limit=limit,
                    score_threshold=0.1,
                )
                dense_results = response.points
            except Exception:
                response = self.client.query_points(
                    collection_name=self.collection,
                    query=query_embedding,
                    query_filter=rbac_filter,
                    limit=limit,
                    score_threshold=0.1,
                )
                dense_results = response.points

            sparse_results = []
            if query_text and settings.ENABLE_HYBRID_SEARCH:
                try:
                    from backend.embeddings.sparse import bm25_encoder
                    sparse_vector = bm25_encoder.encode_query(query_text)
                    if sparse_vector.indices:
                        sparse_resp = self.client.query_points(
                            collection_name=self.collection,
                            query=sparse_vector,
                            using="sparse",
                            query_filter=rbac_filter,
                            limit=top_k * 2,
                        )
                        sparse_results = sparse_resp.points
                except Exception as sparse_err:
                    logger.debug("Sparse search skipped or unavailable: %s", sparse_err)

            dense_rank: dict[str, int] = {}
            dense_score: dict[str, float] = {}
            sparse_rank: dict[str, int] = {}
            sparse_score: dict[str, float] = {}
            point_map: dict[str, Any] = {}
            rrf_scores: dict[str, float] = {}

            for rank, point in enumerate(dense_results, start=1):
                pid = str(point.id)
                dense_rank[pid] = rank
                dense_score[pid] = float(getattr(point, "score", 0.0))
                point_map[pid] = point
                rrf_scores[pid] = rrf_scores.get(pid, 0.0) + 1.0 / (60 + rank)

            for rank, point in enumerate(sparse_results, start=1):
                pid = str(point.id)
                sparse_rank[pid] = rank
                sparse_score[pid] = float(getattr(point, "score", 0.0))
                point_map[pid] = point
                rrf_scores[pid] = rrf_scores.get(pid, 0.0) + 1.0 / (60 + rank)

            if sparse_results:
                sorted_pids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:top_k]
                final_points = [point_map[pid] for pid in sorted_pids]
            else:
                final_points = dense_results[:top_k]

            chunks = []
            for point in final_points:
                payload = point.payload or {}
                pid = str(point.id)
                chunks.append({
                    "content": payload.get("content", ""),
                    "raw_text": payload.get("raw_text", payload.get("content", "")),
                    "parent_content": payload.get("parent_content", ""),
                    "parent_id": payload.get("parent_id", ""),
                    "section_title": payload.get("section_title", ""),
                    "section_index": payload.get("section_index", -1),
                    "chunk_index": payload.get("chunk_index", -1),
                    "title": payload.get("title", "Unknown Document"),
                    "department": payload.get("department", "General"),
                    "page_number": payload.get("page_number", "N/A"),
                    "document_id": payload.get("document_id", ""),
                    "owner": payload.get("owner", ""),
                    "owner_id": payload.get("owner_id", ""),
                    "shared_with": payload.get("shared_with", []),
                    "score": dense_score.get(pid, sparse_score.get(pid, getattr(point, "score", 0.0))),
                    "dense_score": dense_score.get(pid),
                    "dense_rank": dense_rank.get(pid),
                    "sparse_score": sparse_score.get(pid),
                    "sparse_rank": sparse_rank.get(pid),
                    "rrf_score": round(rrf_scores.get(pid, 0.0), 8),
                    "retrieval_method": (
                        "hybrid" if pid in dense_rank and pid in sparse_rank
                        else "dense" if pid in dense_rank
                        else "sparse"
                    ),
                    "point_id": pid,
                })

            logger.info(
                "Retrieved %d authorized chunks | dense=%d sparse=%d | role=%s | department=%s | filter=%s",
                len(chunks),
                len(dense_results),
                len(sparse_results),
                user_role,
                user_department,
                department_filter,
            )
            return chunks

        except Exception as e:
            logger.error("Vector search failed: %s", str(e))
            raise RuntimeError(f"Retrieval failed: {str(e)}") from e

    async def index_chunks(self, points: list[PointStruct]) -> bool:
        return self.manager.upsert_chunks(points)

    async def share_document(self, document_id: str, user_ids: list[str]) -> bool:
        return self.manager.share_document_with_users(document_id, user_ids)

    async def delete_document_chunks(self, document_id: str) -> bool:
        return self.manager.delete_by_document_id(document_id)

    async def has_document_chunks(self, document_id: str) -> bool:
        return self.manager.has_document_chunks(document_id)

    async def find_existing_document_id(self, title: str, department: str) -> str | None:
        return self.manager.find_existing_document_id(title, department)

    async def purge_orphaned_chunks(self, valid_document_ids: set[str]) -> int:
        return self.manager.purge_orphaned_chunks(valid_document_ids)

    def get_document_content(self, document_id: str) -> dict:
        return self.manager.get_document_content(document_id)

    async def check_health(self) -> dict:
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


retriever_service = RetrieverService()

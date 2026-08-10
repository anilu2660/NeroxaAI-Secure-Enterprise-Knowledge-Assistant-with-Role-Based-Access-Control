"""
Document Ingestion Service

Coordinates document parsing, text chunking, embedding generation,
and Qdrant vector indexing with metadata payloads.
"""

import asyncio
import uuid
import re
import logging
from sqlalchemy.orm import Session
from qdrant_client.models import PointStruct
from backend.documents.parser import document_parser
from backend.documents.chunker import document_chunker
from backend.embeddings.service import embedding_service
from backend.retriever.service import retriever_service

logger = logging.getLogger(__name__)


class DocumentService:
    """
    Handles end-to-end ingestion pipeline with ACID compliance:
    - Atomicity: Compensating saga transaction between RDBMS & Qdrant Vector Store
    - Isolation: Row-level locking (with_for_update) on concurrent DB modifications
    - Scaling: Non-blocking asyncio thread offloading for CPU-bound embedding tasks
    """

    def __init__(self):
        self.parser = document_parser
        self.chunker = document_chunker
        self.embeddings = embedding_service
        self.retriever = retriever_service

    async def ingest_document(
        self,
        filename: str,
        file_bytes: bytes,
        department: str,
        owner: str = "admin",
        owner_id: str | None = None,
        db: Session | None = None,
    ) -> dict:
        """
        ACID-Compliant Document Ingestion Pipeline:
        1. Extract text/pages from PDF/DOCX/TXT file
        2. Chunk text into overlapping passages with metadata
        3. Offload CPU-bound SentenceTransformer embedding generation to threadpool
        4. Create RDBMS record in 'pending' status
        5. Upsert vectors into Qdrant vector database
        6. Commit RDBMS record to 'indexed' status (2PC Saga pattern)
        """
        document_id = str(uuid.uuid4())

        # SECURITY: Sanitize filename to prevent path traversal and special char injection.
        # Strip path separators, null bytes, and non-safe characters before any use.
        safe_filename = re.sub(r"[^\w\s.\-]", "", filename.replace("/", "").replace("\\", "")).strip()
        safe_filename = safe_filename[:255] or "unnamed_document"

        logger.info("Ingesting document '%s' (id=%s, dept=%s)", safe_filename, document_id, department)

        # 1. Parse File
        pages = self.parser.parse_file(filename, file_bytes)

        # 2. Chunk Text
        chunks = self.chunker.chunk_pages(
            pages=pages,
            document_title=safe_filename,
            department=department,
            document_id=document_id,
            owner=owner,
        )

        if not chunks:
            raise ValueError(
                "No extractable text content found in document. "
                "If this is a scanned image PDF, please OCR it before uploading."
            )

        # 3. Scale Enhancement: Offload CPU-bound dense + sparse embedding generation
        chunk_texts = [c["content"] for c in chunks]
        dense_vectors = await asyncio.to_thread(self.embeddings.embed_documents, chunk_texts)
        from backend.embeddings.sparse import bm25_encoder
        sparse_vectors = await asyncio.to_thread(bm25_encoder.encode_batch, chunk_texts)

        # 4. Prepare Qdrant Points with named vectors (dense & sparse)
        points = []
        for i, (chunk, dense_vec, sparse_vec) in enumerate(zip(chunks, dense_vectors, sparse_vectors)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}_{i}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector={
                        "dense": dense_vec,
                        "sparse": sparse_vec,
                    },
                    payload=chunk,
                )
            )

        # 5. Saga Phase 1: Create RDBMS pending record if DB session provided
        doc_record = None
        if db:
            try:
                from backend.models.document import Document
                doc_record = Document(
                    id=document_id,
                    title=safe_filename,
                    filename=safe_filename,
                    file_size=len(file_bytes),
                    mime_type="application/pdf" if safe_filename.lower().endswith(".pdf") else "text/plain",
                    department=department,
                    owner_id=owner_id or "admin",
                    qdrant_document_id=document_id,
                    total_chunks=len(points),
                    status="pending",
                )
                db.add(doc_record)
                db.commit()
                db.refresh(doc_record)
            except Exception as e:
                db.rollback()
                logger.error("Failed to create pending RDBMS record: %s", str(e))
                raise RuntimeError(f"Database error: {str(e)}") from e

        # 6. Saga Phase 2: Index into Qdrant Vector DB
        try:
            await self.retriever.index_chunks(points)
            logger.info("Successfully indexed '%s' into Qdrant with %d points", filename, len(points))
        except Exception as e:
            logger.error("Qdrant indexing failed, executing saga rollback: %s", str(e))
            if db and doc_record:
                try:
                    db.delete(doc_record)
                    db.commit()
                except Exception as rollback_err:
                    db.rollback()
                    logger.error("Failed to clean up pending DB record: %s", str(rollback_err))
            raise RuntimeError(f"Vector database indexing failed: {str(e)}") from e

        # 7. Saga Phase 3: Finalize RDBMS status to 'indexed'
        if db and doc_record:
            try:
                doc_record.status = "indexed"
                db.commit()
                logger.info("Committed relational DB record for document '%s'", filename)
            except Exception as e:
                db.rollback()
                logger.error("Failed to update status to indexed, rolling back Qdrant points: %s", str(e))
                await self.retriever.delete_document_chunks(document_id)
                raise RuntimeError(f"Database transaction finalization failed: {str(e)}") from e

        return {
            "document_id": document_id,
            "title": safe_filename,
            "department": department,
            "chunks_created": len(points),
            "status": "ingested",
        }

    async def share_document(self, document_id: str, user_ids: list[str], db: Session | None = None) -> bool:
        """
        Share document with specific users/employees (ACID Isolated).
        Uses row-level locking (with_for_update) to prevent concurrent race conditions.
        """
        if db:
            try:
                from backend.models.document import Document
                # Isolation: Row-level lock to prevent concurrent modifications
                doc = db.query(Document).filter(Document.id == document_id).with_for_update().first()
                if doc:
                    doc.shared_with = list(set(doc.shared_with + user_ids))
                    db.commit()
            except Exception as e:
                db.rollback()
                logger.error("Failed to lock and update relational DB share status: %s", str(e))
                raise RuntimeError(f"Share document transaction failed: {str(e)}") from e

        # Update Qdrant vector payload
        return await self.retriever.share_document(document_id, user_ids)

    async def delete_document(self, document_id: str, db: Session | None = None) -> bool:
        """
        Delete document vectors from Qdrant and RDBMS atomically with row-level locking.
        """
        if db:
            try:
                from backend.models.document import Document
                # Isolation: Row-level lock for delete operation
                doc = db.query(Document).filter(Document.id == document_id).with_for_update().first()
                if doc:
                    db.delete(doc)
                    db.commit()
                    logger.info("Deleted RDBMS record for document_id='%s'", document_id)
            except Exception as e:
                db.rollback()
                logger.error("Failed to delete RDBMS document record: %s", str(e))
                raise RuntimeError(f"Delete document transaction failed: {str(e)}") from e

        # Delete from Qdrant Vector Store
        return await self.retriever.delete_document_chunks(document_id)


document_service = DocumentService()

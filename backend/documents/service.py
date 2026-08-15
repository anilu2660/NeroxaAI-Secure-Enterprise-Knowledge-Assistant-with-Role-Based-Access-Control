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
        document_id = str(uuid.uuid4())

        safe_filename = re.sub(
            r"[^\w\s.\-]",
            "",
            filename.replace("/", "").replace("\\", ""),
        ).strip()
        safe_filename = safe_filename[:255] or "unnamed_document"

        if db:
            try:
                from backend.models.document import Document
                from sqlalchemy import func
                existing = (
                    db.query(Document)
                    .filter(
                        func.lower(Document.filename) == safe_filename.lower(),
                        Document.department == department,
                        Document.status == "indexed",
                    )
                    .first()
                )
                if existing:
                    has_vectors = await self.retriever.has_document_chunks(existing.id)
                    if has_vectors:
                        logger.info(
                            "Document '%s' already exists in department '%s' (id=%s). Ingestion skipped.",
                            safe_filename,
                            department,
                            existing.id,
                        )
                        return {
                            "document_id": existing.id,
                            "title": existing.title,
                            "department": existing.department,
                            "chunks_created": existing.total_chunks,
                            "status": "already_exists",
                        }
                    db.delete(existing)
                    db.commit()
            except Exception as dup_err:
                logger.warning("Duplicate check query failed: %s", str(dup_err))

        existing_qdrant_id = await self.retriever.find_existing_document_id(safe_filename, department)
        if existing_qdrant_id:
            content_info = self.retriever.get_document_content(existing_qdrant_id)
            total_chunks = content_info.get("total_chunks", 0)
            if total_chunks > 0:
                logger.info(
                    "Qdrant vectors already exist for '%s' in '%s' (id=%s). Ingestion skipped.",
                    safe_filename,
                    department,
                    existing_qdrant_id,
                )
                if db:
                    try:
                        from backend.models.document import Document
                        db_existing = (
                            db.query(Document)
                            .filter(Document.id == existing_qdrant_id)
                            .first()
                        )
                        if not db_existing:
                            doc_record = Document(
                                id=existing_qdrant_id,
                                title=safe_filename,
                                filename=safe_filename,
                                file_size=len(file_bytes),
                                mime_type=(
                                    "application/pdf"
                                    if safe_filename.lower().endswith(".pdf")
                                    else "text/plain"
                                ),
                                department=department,
                                owner_id=owner_id or "admin",
                                qdrant_document_id=existing_qdrant_id,
                                total_chunks=total_chunks,
                                status="indexed",
                                shared_with=[],
                            )
                            db.add(doc_record)
                            db.commit()
                    except Exception as db_sync_err:
                        logger.warning("DB sync for existing Qdrant document failed: %s", str(db_sync_err))

                return {
                    "document_id": existing_qdrant_id,
                    "title": safe_filename,
                    "department": department,
                    "chunks_created": total_chunks,
                    "status": "already_exists",
                }

        logger.info(
            "Ingesting document '%s' (id=%s, dept=%s, owner_id=%s)",
            safe_filename,
            document_id,
            department,
            owner_id,
        )

        try:
            import os
            os.makedirs("uploaded_files", exist_ok=True)
            storage_path = os.path.join("uploaded_files", f"{document_id}.pdf")
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
        except Exception as storage_err:
            logger.warning("Could not save binary file to disk: %s", str(storage_err))

        pages = self.parser.parse_file(filename, file_bytes)

        chunks = self.chunker.chunk_pages(
            pages=pages,
            document_title=safe_filename,
            department=department,
            document_id=document_id,
            owner=owner,
            owner_id=owner_id,
        )

        if not chunks:
            raise ValueError(
                "No extractable text content found in document. "
                "If this is a scanned image PDF, please OCR it before uploading."
            )

        chunk_texts = [c["content"] for c in chunks]
        dense_vectors = await asyncio.to_thread(
            self.embeddings.embed_documents,
            chunk_texts,
        )

        from backend.embeddings.sparse import bm25_encoder
        sparse_vectors = await asyncio.to_thread(
            bm25_encoder.encode_batch,
            chunk_texts,
        )

        points = []
        for i, (chunk, dense_vec, sparse_vec) in enumerate(
            zip(chunks, dense_vectors, sparse_vectors)
        ):
            point_id = str(
                uuid.uuid5(
                    uuid.NAMESPACE_DNS,
                    f"{document_id}_{i}",
                )
            )
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

        doc_record = None
        if db:
            try:
                from backend.models.document import Document
                doc_record = Document(
                    id=document_id,
                    title=safe_filename,
                    filename=safe_filename,
                    file_size=len(file_bytes),
                    mime_type=(
                        "application/pdf"
                        if safe_filename.lower().endswith(".pdf")
                        else "text/plain"
                    ),
                    department=department,
                    owner_id=owner_id or "admin",
                    qdrant_document_id=document_id,
                    total_chunks=len(points),
                    status="pending",
                    shared_with=[],
                )
                db.add(doc_record)
                db.commit()
                db.refresh(doc_record)
            except Exception as e:
                db.rollback()
                logger.error("Failed to create pending RDBMS record: %s", str(e))
                raise RuntimeError(f"Database error: {str(e)}") from e

        try:
            await self.retriever.index_chunks(points)
        except Exception as e:
            logger.error("Qdrant indexing failed: %s", str(e))
            if db and doc_record:
                try:
                    db.delete(doc_record)
                    db.commit()
                except Exception as rollback_err:
                    db.rollback()
                    logger.error(
                        "Failed to clean up pending DB record: %s",
                        str(rollback_err),
                    )
            raise RuntimeError(
                f"Vector database indexing failed: {str(e)}"
            ) from e

        if db and doc_record:
            try:
                doc_record.status = "indexed"
                db.commit()
            except Exception as e:
                db.rollback()
                await self.retriever.delete_document_chunks(document_id)
                raise RuntimeError(
                    f"Database transaction finalization failed: {str(e)}"
                ) from e

        return {
            "document_id": document_id,
            "title": safe_filename,
            "department": department,
            "chunks_created": len(points),
            "status": "ingested",
        }

    async def share_document(
        self,
        document_id: str,
        user_ids: list[str],
        db: Session | None = None,
    ) -> bool:
        qdrant_shared_with = list(user_ids)

        if db:
            try:
                from backend.models.document import Document
                doc = (
                    db.query(Document)
                    .filter(Document.id == document_id)
                    .with_for_update()
                    .first()
                )
                if not doc:
                    raise ValueError("Document not found.")

                doc.shared_with = list(
                    set((doc.shared_with or []) + user_ids)
                )
                qdrant_shared_with = list(doc.shared_with)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(
                    "Failed to update document share status: %s",
                    str(e),
                )
                raise RuntimeError(
                    f"Share document transaction failed: {str(e)}"
                ) from e

        return await self.retriever.share_document(
            document_id,
            qdrant_shared_with,
        )

    async def delete_document(
        self,
        document_id: str,
        db: Session | None = None,
    ) -> bool:
        if db:
            try:
                from backend.models.document import Document
                doc = (
                    db.query(Document)
                    .filter(Document.id == document_id)
                    .with_for_update()
                    .first()
                )
                if doc:
                    db.delete(doc)
                    db.commit()
            except Exception as e:
                db.rollback()
                logger.error(
                    "Failed to delete RDBMS document record: %s",
                    str(e),
                )
                raise RuntimeError(
                    f"Delete document transaction failed: {str(e)}"
                ) from e

        return await self.retriever.delete_document_chunks(document_id)


document_service = DocumentService()

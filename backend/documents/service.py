"""
Document Ingestion Service

Coordinates document parsing, text chunking, embedding generation,
and Qdrant vector indexing with metadata payloads.
"""

import uuid
import logging
from qdrant_client.models import PointStruct
from backend.documents.parser import document_parser
from backend.documents.chunker import document_chunker
from backend.embeddings.service import embedding_service
from backend.retriever.service import retriever_service

logger = logging.getLogger(__name__)


class DocumentService:
    """
    Handles end-to-end ingestion pipeline:
    File Upload -> Extract Text -> Chunk Text -> Embed Chunks -> Index into Qdrant
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
    ) -> dict:
        """
        Full Document Ingestion Pipeline:
        1. Extract text/pages from PDF/DOCX/TXT file
        2. Chunk text into overlapping passages with metadata
        3. Generate SentenceTransformer embeddings for each chunk
        4. Upsert vectors into Qdrant vector database
        """
        document_id = str(uuid.uuid4())
        logger.info("Ingesting document '%s' (id=%s, dept=%s)", filename, document_id, department)

        # 1. Parse File
        pages = self.parser.parse_file(filename, file_bytes)

        # 2. Chunk Text
        chunks = self.chunker.chunk_pages(
            pages=pages,
            document_title=filename,
            department=department,
            document_id=document_id,
            owner=owner,
        )

        if not chunks:
            raise ValueError("No extractable text content found in document.")

        # 3. Generate Embeddings for Chunks
        chunk_texts = [c["content"] for c in chunks]
        vectors = self.embeddings.embed_documents(chunk_texts)

        # 4. Prepare Qdrant Points
        points = []
        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}_{i}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=chunk,
                )
            )

        # 5. Index into Qdrant
        await self.retriever.index_chunks(points)
        logger.info("Successfully ingested '%s' into Qdrant with %d points", filename, len(points))

        return {
            "document_id": document_id,
            "title": filename,
            "department": department,
            "chunks_created": len(points),
            "status": "ingested",
        }

    async def share_document(self, document_id: str, user_ids: list[str]) -> bool:
        """
        Share document with specific users/employees so they can access it.
        """
        return await self.retriever.share_document(document_id, user_ids)

    async def delete_document(self, document_id: str) -> bool:
        """
        Delete document vectors from Qdrant vector DB.
        """
        return await self.retriever.delete_document_chunks(document_id)


document_service = DocumentService()

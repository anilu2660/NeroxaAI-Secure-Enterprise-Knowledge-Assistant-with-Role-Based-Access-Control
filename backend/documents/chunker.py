"""
Document Chunker

Splits extracted document text into overlapping chunks for embedding generation.
"""

import logging
from backend.config import settings

logger = logging.getLogger(__name__)


class DocumentChunker:
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        char_size = chunk_size or settings.CHUNK_SIZE
        char_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.chunk_size_words = max(50, char_size // 6)
        self.chunk_overlap_words = max(10, char_overlap // 6)

    def chunk_pages(
        self,
        pages: list[dict],
        document_title: str,
        department: str,
        document_id: str,
        owner: str,
        owner_id: str | None = None,
    ) -> list[dict]:
        chunks = []

        for page in pages:
            page_num = page["page_number"]
            text = page["text"]
            words = text.split()

            if not words:
                continue

            parent_content = (
                f"[Document: {document_title} | Department: {department} | Page: {page_num}]\n"
                f"{text}"
            )
            parent_id = f"{document_id}_p{page_num}"

            step = self.chunk_size_words - self.chunk_overlap_words
            if step <= 0:
                step = self.chunk_size_words

            for i in range(0, len(words), step):
                chunk_words = words[i : i + self.chunk_size_words]
                raw_text = " ".join(chunk_words)

                if len(chunk_words) >= 10:
                    contextual_content = (
                        f"[Document: {document_title} | Department: {department} | Page: {page_num}]\n"
                        f"{raw_text}"
                    )
                    chunks.append({
                        "content": contextual_content,
                        "raw_text": raw_text,
                        "parent_content": parent_content,
                        "parent_id": parent_id,
                        "title": document_title,
                        "department": department,
                        "document_id": document_id,
                        "owner": owner,
                        "owner_id": owner_id,
                        "shared_with": [],
                        "page_number": page_num,
                        "chunk_index": len(chunks) + 1,
                    })

        logger.info(
            "Chunked document '%s' into %d chunks",
            document_title,
            len(chunks),
        )
        return chunks


document_chunker = DocumentChunker()

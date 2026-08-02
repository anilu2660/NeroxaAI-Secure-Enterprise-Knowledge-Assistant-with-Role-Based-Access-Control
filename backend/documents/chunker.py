"""
Document Chunker

Splits extracted document text into overlapping chunks for embedding generation.
Preserves page numbers and metadata for accurate citation generation.
"""

import logging
from backend.config import settings

logger = logging.getLogger(__name__)


class DocumentChunker:
    """
    Splits text into chunks of specified token/character size with overlap.
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_pages(self, pages: list[dict], document_title: str, department: str, document_id: str, owner: str) -> list[dict]:
        """
        Chunk extracted pages into semantic blocks with metadata attached.

        Args:
            pages: List of {"page_number": int, "text": str}
            document_title: Name of the document
            department: Owning department (HR, Finance, Engineering, etc.)
            document_id: UUID of the document
            owner: User who uploaded it

        Returns:
            List of chunk dicts ready for embedding and Qdrant ingestion.
        """
        chunks = []

        for page in pages:
            page_num = page["page_number"]
            text = page["text"]

            words = text.split()
            if not words:
                continue

            # Sliding window over words (approximating token chunks)
            step = self.chunk_size - self.chunk_overlap
            if step <= 0:
                step = self.chunk_size

            for i in range(0, len(words), step):
                chunk_words = words[i : i + self.chunk_size]
                chunk_text = " ".join(chunk_words)

                if len(chunk_words) >= 10:  # Skip trivial tiny chunks
                    chunks.append({
                        "content": chunk_text,
                        "title": document_title,
                        "department": department,
                        "page_number": page_num,
                        "document_id": document_id,
                        "owner": owner,
                        "chunk_index": len(chunks) + 1,
                    })

        logger.info("Chunked document '%s' into %d chunks", document_title, len(chunks))
        return chunks


document_chunker = DocumentChunker()

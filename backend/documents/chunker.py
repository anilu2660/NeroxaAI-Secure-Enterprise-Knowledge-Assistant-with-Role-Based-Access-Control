"""
Document Chunker

Splits extracted document text into overlapping chunks for embedding generation.
Supports Parent-Child chunking:
  - Child Chunks (~150 words): Embedded in Qdrant for high-precision vector search
  - Parent Chunks (Full Page / ~600 words): Attached in payload to provide LLM with full context
"""

import logging
from backend.config import settings

logger = logging.getLogger(__name__)


class DocumentChunker:
    """
    Splits text into Parent-Child chunk structures with metadata and contextual headers.
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        char_size = chunk_size or settings.CHUNK_SIZE
        char_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        # Convert character settings (~6 chars per word) to word units for word sliding window
        self.chunk_size_words = max(50, char_size // 6)
        self.chunk_overlap_words = max(10, char_overlap // 6)

    def chunk_pages(self, pages: list[dict], document_title: str, department: str, document_id: str, owner: str) -> list[dict]:
        """
        Chunk extracted pages into Parent-Child semantic blocks with metadata attached.

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

            # Parent Context (Full Page Text with Header Injection)
            parent_content = (
                f"[Document: {document_title} | Department: {department} | Page: {page_num}]\n"
                f"{text}"
            )
            parent_id = f"{document_id}_p{page_num}"

            # Sliding window over words for Child Chunks
            step = self.chunk_size_words - self.chunk_overlap_words
            if step <= 0:
                step = self.chunk_size_words

            for i in range(0, len(words), step):
                chunk_words = words[i : i + self.chunk_size_words]
                raw_text = " ".join(chunk_words)

                if len(chunk_words) >= 10:  # Skip trivial tiny chunks
                    # Contextual Header Injection for Child Chunk (vector search target)
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
                        "page_number": page_num,
                        "document_id": document_id,
                        "owner": owner,
                        "chunk_index": len(chunks) + 1,
                    })

        logger.info("Chunked document '%s' into %d Parent-Child chunks", document_title, len(chunks))
        return chunks


document_chunker = DocumentChunker()

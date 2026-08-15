"""
Document Chunker

Splits extracted document text into overlap-aware, structure-preserving chunks.
The chunker keeps headings/paragraphs together where possible so policy rules,
requirements, and their conditions are less likely to be separated.
"""

import logging
import re

from backend.config import settings

logger = logging.getLogger(__name__)


class DocumentChunker:
    """Create retrieval chunks while preserving lightweight document structure."""

    _HEADING_RE = re.compile(
        r"^(?:\d+(?:\.\d+)*[.)]?|[IVXLCDM]+[.)]|[A-Z][.)])\s+.+$"
    )

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        char_size = chunk_size or settings.CHUNK_SIZE
        char_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.chunk_size_words = max(80, char_size // 6)
        self.chunk_overlap_words = max(15, char_overlap // 6)

    @staticmethod
    def _normalise_lines(text: str) -> list[str]:
        lines = []
        for line in text.splitlines():
            line = re.sub(r"\s+", " ", line).strip()
            if line:
                lines.append(line)
        return lines

    def _sectionize(self, text: str) -> list[tuple[str, str]]:
        """Return [(heading, body)] blocks using conservative heading detection."""
        lines = self._normalise_lines(text)
        if not lines:
            return []

        sections: list[tuple[str, list[str]]] = []
        current_heading = ""
        current_body: list[str] = []

        for line in lines:
            is_heading = bool(self._HEADING_RE.match(line)) or (
                len(line) <= 120
                and line.endswith((':',))
                and len(line.split()) <= 14
            )
            if is_heading and current_body:
                sections.append((current_heading, current_body))
                current_heading = line
                current_body = []
            elif is_heading and not current_body:
                current_heading = line
            else:
                current_body.append(line)

        if current_body or current_heading:
            sections.append((current_heading, current_body))

        return [(heading, "\n".join(body).strip()) for heading, body in sections if body]

    def _make_chunks(self, text: str) -> list[tuple[str, str]]:
        words = text.split()
        if len(words) <= self.chunk_size_words:
            return [(text, "")]

        step = max(1, self.chunk_size_words - self.chunk_overlap_words)
        result = []
        for start in range(0, len(words), step):
            chunk_words = words[start : start + self.chunk_size_words]
            if len(chunk_words) < 10:
                break
            result.append((" ".join(chunk_words), ""))
        return result

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
            text = page.get("text", "") or ""
            if not text.strip():
                continue

            page_header = (
                f"[Document: {document_title} | Department: {department} | Page: {page_num}]"
            )
            sections = self._sectionize(text)
            if not sections:
                sections = [("", text.strip())]

            for section_idx, (heading, body) in enumerate(sections, start=1):
                section_label = heading.strip()
                section_text = f"{section_label}\n{body}".strip() if section_label else body
                parent_content = f"{page_header}\n{section_text}"
                parent_id = f"{document_id}_p{page_num}_s{section_idx}"

                for raw_text, _ in self._make_chunks(section_text):
                    contextual_content = f"{page_header}"
                    if section_label:
                        contextual_content += f"\n[Section: {section_label}]"
                    contextual_content += f"\n{raw_text}"

                    chunks.append({
                        "content": contextual_content,
                        "raw_text": raw_text,
                        "parent_content": parent_content,
                        "parent_id": parent_id,
                        "section_title": section_label,
                        "title": document_title,
                        "department": department,
                        "document_id": document_id,
                        "owner": owner,
                        "owner_id": owner_id,
                        "shared_with": [],
                        "page_number": page_num,
                        "section_index": section_idx,
                        "chunk_index": len(chunks) + 1,
                    })

        logger.info(
            "Chunked document '%s' into %d structure-aware chunks",
            document_title,
            len(chunks),
        )
        return chunks


document_chunker = DocumentChunker()

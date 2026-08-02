"""
Document Parser

Extracts text and page numbers from PDF, DOCX, and TXT files.
"""

import io
import logging
from pypdf import PdfReader
import docx

logger = logging.getLogger(__name__)


class DocumentParser:
    """
    Parses uploaded enterprise documents (PDF, DOCX, TXT)
    and extracts page-by-page text content.
    """

    @staticmethod
    def parse_pdf(file_bytes: bytes) -> list[dict]:
        """
        Extract text from a PDF file per page.

        Returns:
            List of dicts: [{"page_number": 1, "text": "..."}, ...]
        """
        pages = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for i, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append({
                        "page_number": i,
                        "text": text.strip()
                    })
            logger.info("Successfully parsed PDF with %d pages", len(pages))
            return pages
        except Exception as e:
            logger.error("PDF parsing failed: %s", str(e))
            raise ValueError(f"Failed to parse PDF file: {str(e)}") from e

    @staticmethod
    def parse_docx(file_bytes: bytes) -> list[dict]:
        """
        Extract text from a DOCX file.
        """
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            full_text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            return [{"page_number": 1, "text": full_text}]
        except Exception as e:
            logger.error("DOCX parsing failed: %s", str(e))
            raise ValueError(f"Failed to parse DOCX file: {str(e)}") from e

    @staticmethod
    def parse_txt(file_bytes: bytes) -> list[dict]:
        """
        Extract text from a TXT file.
        """
        try:
            text = file_bytes.decode("utf-8")
            return [{"page_number": 1, "text": text.strip()}]
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode("latin-1")
                return [{"page_number": 1, "text": text.strip()}]
            except Exception as e:
                raise ValueError("Failed to decode TXT file encoding.") from e

    def parse_file(self, filename: str, file_bytes: bytes) -> list[dict]:
        """
        Determine file type from filename extension and extract text.
        """
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            return self.parse_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            return self.parse_docx(file_bytes)
        elif ext == "txt":
            return self.parse_txt(file_bytes)
        else:
            raise ValueError(f"Unsupported file format: '.{ext}'. Supported formats: PDF, DOCX, TXT")


document_parser = DocumentParser()

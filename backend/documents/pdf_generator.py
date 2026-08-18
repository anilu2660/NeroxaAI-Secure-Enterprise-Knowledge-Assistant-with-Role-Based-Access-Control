"""
PDF Synthesizer Utility

Generates valid, readable PDF binaries from stored document chunks.
Used when local file storage is ephemeral (e.g., cloud restarts) to ensure
raw PDF view and download are always available.
"""

import io
import textwrap


def create_pdf_from_content(title: str, department: str, chunks: list[str]) -> bytes:
    """
    Synthesize a valid PDF document with header metadata and wrapped text chunks.
    """
    pages_text: list[list[str]] = []
    current_lines: list[str] = [
        f"{title}",
        f"Department: {department} | NeroxaAI Enterprise Assistant",
        "-" * 70,
        "",
    ]

    for chunk in chunks:
        lines = chunk.split("\n")
        for raw_line in lines:
            wrapped = textwrap.wrap(raw_line, width=75) if raw_line.strip() else [""]
            for line in wrapped:
                current_lines.append(line)
                if len(current_lines) >= 44:
                    pages_text.append(current_lines)
                    current_lines = []
        current_lines.append("")

    if current_lines:
        pages_text.append(current_lines)

    if not pages_text:
        pages_text = [[f"{title}", "No text content available."]]

    # Escape PDF text characters
    def escape_pdf_text(text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    # Build PDF 1.4 structure
    objects: list[bytes] = []

    def add_object(obj_content: str | bytes) -> int:
        idx = len(objects) + 1
        if isinstance(obj_content, str):
            obj_content = obj_content.encode("latin-1", "replace")
        objects.append(obj_content)
        return idx

    # Object 1: Catalog
    # Object 2: Outlines
    # Object 3: Pages
    # Object 4: Font
    catalog_id = 1
    outlines_id = 2
    pages_id = 3
    font_id = 4

    page_obj_ids: list[int] = []

    # Pre-reserve 4 objects
    objects.extend([b"", b"", b"", b""])

    # Font object (Helvetica)
    objects[font_id - 1] = (
        f"{font_id} 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj".encode("latin-1")
    )

    # For each page, create Content stream and Page object
    for page_idx, page_lines in enumerate(pages_text, start=1):
        stream_lines = [
            "BT",
            "/F1 10 Tf",
            "14.4 TL",
            "40 760 Td",
        ]
        for line_idx, line in enumerate(page_lines):
            # Bold title on first page top
            if page_idx == 1 and line_idx == 0:
                stream_lines.append("/F1 14 Tf")
                stream_lines.append(f"({escape_pdf_text(line)}) Tj")
                stream_lines.append("/F1 10 Tf")
                stream_lines.append("T*")
            else:
                stream_lines.append(f"({escape_pdf_text(line)}) Tj")
                stream_lines.append("T*")
        stream_lines.append("ET")

        content_str = "\n".join(stream_lines)
        content_bytes = content_str.encode("latin-1", "replace")

        content_obj_id = add_object(
            f"{len(objects) + 1} 0 obj\n<< /Length {len(content_bytes)} >>\nstream\n".encode("latin-1")
            + content_bytes
            + b"\nendstream\nendobj"
        )

        page_obj_id = add_object(
            f"{len(objects) + 1} 0 obj\n<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_obj_id} 0 R /Resources << /Font << /F1 {font_id} 0 R >> >> >>\nendobj".encode("latin-1")
        )
        page_obj_ids.append(page_obj_id)

    # Pages Object
    kids_str = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    objects[pages_id - 1] = (
        f"{pages_id} 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {len(page_obj_ids)} >>\nendobj".encode("latin-1")
    )

    # Outlines Object
    objects[outlines_id - 1] = (
        f"{outlines_id} 0 obj\n<< /Type /Outlines /Count 0 >>\nendobj".encode("latin-1")
    )

    # Catalog Object
    objects[catalog_id - 1] = (
        f"{catalog_id} 0 obj\n<< /Type /Catalog /Pages {pages_id} 0 R /Outlines {outlines_id} 0 R >>\nendobj".encode("latin-1")
    )

    # Output generation
    buf = io.BytesIO()
    buf.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets: list[int] = [0]
    for obj in objects:
        offsets.append(buf.tell())
        buf.write(obj)
        buf.write(b"\n")

    xref_offset = buf.tell()
    buf.write(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    buf.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        buf.write(f"{offset:010d} 00000 n \n".encode("ascii"))

    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    )
    buf.write(trailer.encode("ascii"))
    return buf.getvalue()

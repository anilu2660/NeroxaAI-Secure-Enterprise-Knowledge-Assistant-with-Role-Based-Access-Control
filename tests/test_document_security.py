import io
import zipfile

import pytest
from fastapi import HTTPException

from backend.documents.security import (
    sanitize_filename,
    validate_upload,
)


def test_path_traversal_filename_is_sanitized():
    safe_name = sanitize_filename("../../secret.pdf")
    assert safe_name == "secret.pdf"


def test_invalid_extension_is_rejected():
    with pytest.raises(HTTPException) as exc:
        validate_upload("malware.exe", b"MZ")
    assert exc.value.status_code == 400


def test_pdf_signature_is_required():
    with pytest.raises(HTTPException) as exc:
        validate_upload("document.pdf", b"not a pdf")
    assert exc.value.status_code == 400


def test_docx_structure_is_validated():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("random.txt", "data")

    with pytest.raises(HTTPException) as exc:
        validate_upload("document.docx", buffer.getvalue())
    assert exc.value.status_code == 400


def test_valid_docx_is_accepted():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("word/document.xml", "<document/>")

    filename, mime = validate_upload("document.docx", buffer.getvalue())
    assert filename == "document.docx"
    assert mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def test_txt_is_accepted():
    filename, mime = validate_upload("notes.txt", "hello world".encode("utf-8"))
    assert filename == "notes.txt"
    assert mime == "text/plain"

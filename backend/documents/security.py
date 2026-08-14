import os
import re
import zipfile
from pathlib import Path

from fastapi import HTTPException, status

from backend.config import settings


ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_ARCHIVE_FILES = 1000
MAX_ARCHIVE_UNCOMPRESSED_BYTES = 50 * 1024 * 1024

EXTENSION_MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}


def sanitize_filename(filename: str) -> str:
    name = Path(filename or "").name
    name = name.replace("\x00", "")
    name = re.sub(r"[^A-Za-z0-9._ -]", "", name).strip()
    name = re.sub(r"\s+", " ", name)
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename.",
        )
    if len(name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is too long.",
        )
    return name


def get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def validate_extension(filename: str) -> str:
    extension = get_extension(filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Allowed formats: PDF, DOCX, TXT.",
        )
    return extension


def validate_file_size(file_bytes: bytes) -> None:
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )


def validate_file_signature(filename: str, file_bytes: bytes, extension: str) -> None:
    if extension == "pdf":
        if not file_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match the PDF extension.",
            )
        return

    if extension == "docx":
        if not file_bytes.startswith(b"PK"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match the DOCX extension.",
            )
        try:
            with zipfile.ZipFile(__import__("io").BytesIO(file_bytes)) as archive:
                names = archive.namelist()
                if len(names) > MAX_ARCHIVE_FILES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="DOCX archive contains too many files.",
                    )
                total_size = sum(info.file_size for info in archive.infolist())
                if total_size > MAX_ARCHIVE_UNCOMPRESSED_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="DOCX archive expands beyond the allowed limit.",
                    )
                if "[Content_Types].xml" not in names or "word/document.xml" not in names:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid DOCX document structure.",
                    )
        except zipfile.BadZipFile as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid DOCX archive.",
            ) from exc
        return

    if extension == "txt":
        try:
            file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                file_bytes.decode("latin-1")
            except UnicodeDecodeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid text file encoding.",
                ) from exc


def validate_upload(filename: str, file_bytes: bytes) -> tuple[str, str]:
    safe_filename = sanitize_filename(filename)
    extension = validate_extension(safe_filename)
    validate_file_size(file_bytes)
    validate_file_signature(safe_filename, file_bytes, extension)
    return safe_filename, EXTENSION_MIME_TYPES[extension]


def safe_storage_path(storage_root: str, filename: str) -> str:
    root = Path(storage_root).resolve()
    candidate = (root / Path(filename).name).resolve()
    if candidate.parent != root:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid storage path.",
        )
    os.makedirs(root, exist_ok=True)
    return str(candidate)

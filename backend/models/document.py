"""
Document ORM Model

SQLAlchemy ORM model for storing metadata of uploaded documents.
"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.models.user import User


class Document(Base, TimestampMixin):
    """
    Document table for tracking uploaded files, department ownership, and Qdrant IDs.
    """

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, default="application/pdf")
    department: Mapped[str] = mapped_column(String(100), nullable=False, default="General", index=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    qdrant_document_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    total_chunks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="indexed")
    shared_with: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Relationships
    owner_user: Mapped["User"] = relationship("User", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document title='{self.title}' department='{self.department}' chunks={self.total_chunks}>"

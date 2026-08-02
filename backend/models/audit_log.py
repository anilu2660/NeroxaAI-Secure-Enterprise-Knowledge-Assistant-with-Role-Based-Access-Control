"""
AuditLog ORM Model

SQLAlchemy ORM model for recording compliance audit trails:
- User login
- Document uploaded
- Document deleted
- Query executed
- Unauthorized access attempt
- Role updated
"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.models.user import User


class AuditLog(Base, TimestampMixin):
    """
    AuditLog table for enterprise compliance tracking.
    """

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    resource: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog event='{self.event_type}' user='{self.user_email}' action='{self.action}'>"

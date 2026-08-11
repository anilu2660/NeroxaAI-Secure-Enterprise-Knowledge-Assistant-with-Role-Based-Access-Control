"""
User ORM Model

SQLAlchemy ORM model for storing application users, authentication details,
department, and role associations.
"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.models.role import Role
    from backend.models.document import Document
    from backend.models.audit_log import AuditLog


class User(Base, TimestampMixin):
    """
    User table for user accounts, department assignments, and RBAC role linking.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False, default="General", index=True)
    role_id: Mapped[str] = mapped_column(String(50), ForeignKey("roles.id"), nullable=False, default="employee")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    role_rel: Mapped["Role"] = relationship("Role", back_populates="users")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="owner_user")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")
    chat_sessions: Mapped[list["ChatSession"]] = relationship("ChatSession", back_populates="user")
    feedbacks: Mapped[list["Feedback"]] = relationship("Feedback", back_populates="user")

    def __repr__(self) -> str:
        return f"<User email='{self.email}' role='{self.role_id}' department='{self.department}'>"


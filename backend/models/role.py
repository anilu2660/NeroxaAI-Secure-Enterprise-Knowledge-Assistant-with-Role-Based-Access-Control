"""
Role ORM Model

SQLAlchemy ORM model for storing roles and permissions.
"""

from typing import TYPE_CHECKING
from sqlalchemy import String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.models.user import User


class Role(Base, TimestampMixin):
    """
    Role table representing system roles (admin, hr, finance, engineering, sales, employee).
    """

    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    permissions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role_rel", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Role name='{self.name}'>"

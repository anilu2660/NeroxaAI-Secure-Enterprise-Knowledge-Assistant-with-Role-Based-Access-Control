"""
Feedback ORM Model

SQLAlchemy model for recording user ratings (thumbs up/down) and knowledge gap analytics.
"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.models.user import User


class Feedback(Base, TimestampMixin):
    """
    Feedback table for RLHF user ratings and missing knowledge analytics.
    """

    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # +1 for thumbs up, -1 for thumbs down
    feedback_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    chunks_retrieved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    department: Mapped[str] = mapped_column(String(100), default="General", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="feedbacks")

    def __repr__(self) -> str:
        return f"<Feedback user_id='{self.user_id}' rating={self.rating} query='{self.query[:30]}...'>"

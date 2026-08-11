"""
Feedback Service

Business logic for processing user feedback (RLHF ratings) and Knowledge Gap Analytics.
"""

import logging
from sqlalchemy.orm import Session
from backend.models.feedback import Feedback
from backend.models.user import User
from backend.models.audit_log import AuditLog
from backend.feedback.schemas import SubmitFeedbackRequest, KnowledgeGapReportItem

logger = logging.getLogger(__name__)


class FeedbackService:
    """
    Service for feedback recording and missing knowledge analytics.
    """

    def record_feedback(self, db: Session, user: User, data: SubmitFeedbackRequest) -> Feedback:
        """Record user rating and feedback comments."""
        fb = Feedback(
            user_id=user.id,
            query=data.query,
            answer=data.answer,
            rating=data.rating,
            feedback_text=data.feedback_text,
            chunks_retrieved=data.chunks_retrieved,
            department=data.department or user.department,
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)

        logger.info(
            "FEEDBACK RECORDED | User: %s | Rating: %d | Query: '%s'",
            user.email,
            data.rating,
            data.query[:40],
        )
        return fb

    def get_knowledge_gap_analytics(self, db: Session, limit: int = 50) -> list[KnowledgeGapReportItem]:
        """
        Analyze Knowledge Base gaps for HR/Admin:
        Identifies queries that received negative ratings (-1) or returned 0 chunks.
        """
        results = []

        # 1. Negative ratings from feedback table
        negative_fb = (
            db.query(Feedback)
            .filter(Feedback.rating == -1)
            .order_by(Feedback.created_at.desc())
            .limit(limit)
            .all()
        )

        for fb in negative_fb:
            results.append(
                KnowledgeGapReportItem(
                    query=fb.query,
                    department=fb.department,
                    user_email=fb.user.email if fb.user else None,
                    chunks_retrieved=fb.chunks_retrieved,
                    reason="Negative User Feedback (Thumbs Down)",
                    created_at=fb.created_at,
                )
            )

        return results


feedback_service = FeedbackService()

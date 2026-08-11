"""
Feedback & Analytics Routes

API endpoints for submitting user ratings and viewing Knowledge Gap analytics (Admin only).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.api.dependencies import get_current_user
from backend.models.user import User
from backend.roles.middleware import require_admin
from backend.feedback.schemas import (
    SubmitFeedbackRequest,
    FeedbackResponse,
    KnowledgeGapReportItem,
)
from backend.feedback.service import feedback_service

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback & Knowledge Gap Analytics"])


@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback rating (Thumbs Up / Down)",
)
def submit_feedback(
    request: SubmitFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit rating (+1 / -1) and comments for a generated answer."""
    return feedback_service.record_feedback(db, current_user, request)


@router.get(
    "/analytics/knowledge-gaps",
    response_model=list[KnowledgeGapReportItem],
    summary="Get Knowledge Gap Analytics report (Admin only)",
)
def get_knowledge_gaps(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_role: str = Depends(require_admin),
):
    """
    Retrieve queries with negative user ratings or zero context chunks.
    Used by HR/Admin to identify missing documents and knowledge base gaps.
    """
    return feedback_service.get_knowledge_gap_analytics(db, limit=limit)

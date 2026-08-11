"""
Feedback Schemas

Pydantic models for user feedback submission and Knowledge Gap analytics.
"""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SubmitFeedbackRequest(BaseModel):
    query: str = Field(..., description="Original user query.")
    answer: str = Field(..., description="Generated answer.")
    rating: int = Field(..., description="+1 for thumbs up, -1 for thumbs down.")
    feedback_text: str | None = Field(default=None, description="Optional text comment.")
    chunks_retrieved: int = Field(default=0, description="Chunks retrieved.")
    department: str = Field(default="General", description="User department.")


class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    query: str
    rating: int
    feedback_text: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class KnowledgeGapReportItem(BaseModel):
    query: str
    department: str
    user_email: str | None
    chunks_retrieved: int
    reason: str
    created_at: datetime

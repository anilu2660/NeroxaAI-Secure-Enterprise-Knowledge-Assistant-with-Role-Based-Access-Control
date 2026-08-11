"""
Chat Schemas

Pydantic models for chat session and conversational memory API payloads.
"""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CreateChatSessionRequest(BaseModel):
    title: str = Field(default="New Conversation", description="Title for the chat session.")


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sources: list[dict] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    messages: list[ChatMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)



class SendChatMessageRequest(BaseModel):
    session_id: str = Field(..., description="Target chat session ID.")
    message: str = Field(..., description="User message/query.")
    department_filter: str | None = Field(default=None, description="Optional department filter.")

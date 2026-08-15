"""
Chat Schemas

Pydantic models for chat session and conversational memory API payloads.
"""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict


class CreateChatSessionRequest(BaseModel):
    title: str = Field(default="New Conversation", description="Title for the chat session.")


class ChatExecutionMetadata(BaseModel):
    route: str | None = None
    route_confidence: float | None = None
    rewritten_query: str | None = None
    cached: bool = False
    model: str | None = None
    chunks_retrieved: int = 0
    sources: list[dict] = Field(default_factory=list)
    tool_name: str | None = None
    tool_status: str | None = None
    tool_result: Any = None
    agent_plan: dict | None = None
    agent_steps: list[dict] = Field(default_factory=list)
    web_search_status: str | None = None


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sources: list[dict] | None = None
    execution_metadata: ChatExecutionMetadata | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    messages: list[ChatMessageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SendChatMessageRequest(BaseModel):
    session_id: str = Field(..., description="Target chat session ID.")
    message: str = Field(..., description="User message/query.")
    department_filter: str | None = Field(default=None, description="Optional department filter.")

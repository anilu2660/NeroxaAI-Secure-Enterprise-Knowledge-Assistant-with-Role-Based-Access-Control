"""
Chat Routes

API endpoints for managing multi-turn chat sessions and messaging.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.api.dependencies import get_current_user
from backend.models.user import User
from backend.chat.schemas import (
    CreateChatSessionRequest,
    ChatSessionResponse,
    ChatMessageResponse,
    SendChatMessageRequest,
)
from backend.chat.service import chat_service
from backend.utils.rate_limiter import rate_limit_guard

router = APIRouter(prefix="/api/v1/chat", tags=["Conversational Chat"])


@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat session",
)
def create_session(
    request: CreateChatSessionRequest = CreateChatSessionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new conversational chat session."""
    return chat_service.create_session(db, current_user, title=request.title)


@router.get(
    "/sessions",
    response_model=list[ChatSessionResponse],
    summary="List all user chat sessions",
)
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all chat sessions for the authenticated user."""
    return chat_service.get_user_sessions(db, current_user)


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    summary="Get chat session details and message history",
)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get chat session and full message history."""
    return chat_service.get_session_by_id(db, session_id, current_user)


@router.delete(
    "/sessions/{session_id}",
    summary="Delete a chat session",
)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a chat session and all contained messages."""
    chat_service.delete_session(db, session_id, current_user)
    return {"status": "deleted", "session_id": session_id}


@router.post(
    "/message",
    response_model=ChatMessageResponse,
    summary="Send a message in a multi-turn chat session",
    dependencies=[Depends(rate_limit_guard("query"))],
)
async def send_message(
    request: SendChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send user prompt, incorporate history, execute RAG search, and return assistant response.
    """
    return await chat_service.process_chat_message(
        db=db,
        session_id=request.session_id,
        user=current_user,
        user_message=request.message,
        department_filter=request.department_filter,
    )

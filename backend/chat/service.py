"""
Chat Service

Business logic for managing multi-turn conversational chat sessions,
conversation context condensation, RAG invocation, and DB persistence.
"""

import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models.chat import ChatSession, ChatMessage
from backend.models.user import User
from backend.rag.service import rag_service

logger = logging.getLogger(__name__)


class ChatService:
    """
    Manages multi-turn conversation memory and DB persistence.
    """

    def create_session(self, db: Session, user: User, title: str = "New Conversation") -> ChatSession:
        """Create a new chat session for user."""
        session = ChatSession(user_id=user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_user_sessions(self, db: Session, user: User) -> list[ChatSession]:
        """List all chat sessions for user."""
        return (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user.id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

    def get_session_by_id(self, db: Session, session_id: str, user: User) -> ChatSession:
        """Retrieve specific session ensuring ownership."""
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
            .first()
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat session '{session_id}' not found or access denied.",
            )
        return session

    def delete_session(self, db: Session, session_id: str, user: User) -> bool:
        """Delete chat session and its messages."""
        session = self.get_session_by_id(db, session_id, user)
        db.delete(session)
        db.commit()
        return True

    async def process_chat_message(
        self,
        db: Session,
        session_id: str,
        user: User,
        user_message: str,
        department_filter: str | None = None,
    ) -> ChatMessage:
        """
        Multi-turn Conversational RAG Execution:
        1. Validate session ownership.
        2. Record user message in DB.
        3. Build contextual query incorporating past conversation history.
        4. Execute RBAC-scoped RAG search and generation.
        5. Record assistant response in DB.
        6. Update session title if first turn.
        """
        session = self.get_session_by_id(db, session_id, user)

        # 1. Save user message to DB
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)
        db.commit()

        # 2. Build conversational context from last 6 messages
        recent_messages = session.messages[-6:]
        history_str = ""
        for m in recent_messages[:-1]:  # exclude current user_msg
            history_str += f"{m.role.capitalize()}: {m.content}\n"

        # Construct contextualized query if history exists
        if history_str.strip():
            contextualized_query = (
                f"Conversation History:\n{history_str}\n"
                f"Follow-up Question: {user_message}\n"
                f"Please answer the follow-up question in context of the conversation."
            )
        else:
            contextualized_query = user_message

        # Auto-update session title on first message
        if session.title == "New Conversation" and len(session.messages) <= 2:
            clean_title = user_message[:40] + ("..." if len(user_message) > 40 else "")
            session.title = clean_title
            db.commit()

        # 3. Execute RAG query with user's RBAC role and department
        rag_result = await rag_service.query(
            query=contextualized_query,
            user_role=user.role_id,
            user_department=user.department,
            department_filter=department_filter,
        )

        # 4. Save assistant response to DB
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=rag_result["answer"],
            sources=rag_result.get("sources", []),
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return assistant_msg


chat_service = ChatService()

"""
Chat Service

Business logic for managing multi-turn conversational chat sessions,
conversation context condensation, query routing, RAG invocation, and DB persistence.
"""

import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.chat import ChatSession, ChatMessage
from backend.models.user import User
from backend.orchestrator.service import query_orchestrator

logger = logging.getLogger(__name__)


class ChatService:
    def create_session(
        self,
        db: Session,
        user: User,
        title: str = "New Conversation",
    ) -> ChatSession:
        session = ChatSession(user_id=user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_user_sessions(
        self,
        db: Session,
        user: User,
    ) -> list[ChatSession]:
        return (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user.id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

    def get_session_by_id(
        self,
        db: Session,
        session_id: str,
        user: User,
    ) -> ChatSession:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user.id,
            )
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat session '{session_id}' not found or access denied.",
            )

        return session

    def delete_session(
        self,
        db: Session,
        session_id: str,
        user: User,
    ) -> bool:
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
        session = self.get_session_by_id(db, session_id, user)

        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)
        db.commit()

        recent_messages = session.messages[-7:-1]
        history_parts = []
        for message in recent_messages:
            history_parts.append(
                f"{message.role.capitalize()}: {message.content}"
            )

        history_str = "\n".join(history_parts)

        if session.title == "New Conversation" and len(session.messages) <= 2:
            clean_title = user_message[:40] + (
                "..." if len(user_message) > 40 else ""
            )
            session.title = clean_title
            db.commit()

        result = await query_orchestrator.process(
            query=user_message,
            user_id=user.id,
            user_role=user.role_id,
            user_department=user.department,
            conversation_history=history_str,
            department_filter=department_filter,
        )

        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=result["answer"],
            sources=result.get("sources", []),
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return assistant_msg


chat_service = ChatService()

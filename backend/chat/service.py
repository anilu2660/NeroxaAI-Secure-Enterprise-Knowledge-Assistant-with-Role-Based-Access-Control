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
    def create_session(
        self,
        db: Session,
        user: User,
        title: str = "New Conversation",
    ) -> ChatSession:
        session = ChatSession(
            user_id=user.id,
            title=title,
        )
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
        session = self.get_session_by_id(
            db,
            session_id,
            user,
        )
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
        session = self.get_session_by_id(
            db,
            session_id,
            user,
        )

        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)
        db.commit()

        recent_messages = session.messages[-6:]
        history_str = ""

        for message in recent_messages[:-1]:
            history_str += (
                f"{message.role.capitalize()}: "
                f"{message.content}\n"
            )

        if history_str.strip():
            contextualized_query = (
                f"Conversation History:\n{history_str}\n"
                f"Follow-up Question: {user_message}\n"
                f"Please answer the follow-up question in context of the conversation."
            )
        else:
            contextualized_query = user_message

        if session.title == "New Conversation" and len(session.messages) <= 2:
            clean_title = user_message[:40] + (
                "..."
                if len(user_message) > 40
                else ""
            )
            session.title = clean_title
            db.commit()

        rag_result = await rag_service.query(
            query=contextualized_query,
            user_id=user.id,
            user_role=user.role_id,
            user_department=user.department,
            department_filter=department_filter,
        )

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

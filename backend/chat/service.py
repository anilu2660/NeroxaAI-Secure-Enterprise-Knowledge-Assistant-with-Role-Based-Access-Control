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
    def create_session(self, db: Session, user: User, title: str = "New Conversation") -> ChatSession:
        session = ChatSession(user_id=user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_user_sessions(self, db: Session, user: User) -> list[ChatSession]:
        return (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user.id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

    def get_session_by_id(self, db: Session, session_id: str, user: User) -> ChatSession:
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
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
            .first()
        )
        if not session:
            session = ChatSession(id=session_id, user_id=user.id, title="New Conversation")
            db.add(session)
            db.commit()
            db.refresh(session)

        user_msg = ChatMessage(session_id=session.id, role="user", content=user_message)
        db.add(user_msg)
        db.commit()

        # Keep bounded recent history so prompts do not grow without limit.
        recent_messages = session.messages[-7:-1]
        history_str = "\n".join(
            f"{message.role.capitalize()}: {message.content}" for message in recent_messages
        )

        if session.title == "New Conversation" and len(session.messages) <= 2:
            session.title = user_message[:40] + ("..." if len(user_message) > 40 else "")
            db.commit()

        result = await query_orchestrator.process(
            query=user_message,
            user_id=user.id,
            user_role=user.role_id,
            user_department=user.department,
            conversation_history=history_str,
            department_filter=department_filter,
        )

        # Persist only structured metadata that is safe/useful for rendering.
        # Tool arguments are intentionally excluded from the API contract here.
        execution_metadata = {
            "route": result.get("route"),
            "route_confidence": result.get("route_confidence"),
            "rewritten_query": result.get("rewritten_query"),
            "cached": bool(result.get("cached", False)),
            "model": result.get("model"),
            "chunks_retrieved": int(result.get("chunks_retrieved", 0) or 0),
            "sources": result.get("sources", []),
            "tool_name": result.get("tool_name"),
            "tool_status": result.get("tool_status"),
            "tool_result": result.get("tool_result"),
            "agent_plan": result.get("agent_plan"),
            "agent_steps": result.get("agent_steps", []),
            "web_search_status": result.get("web_search_status"),
        }

        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=result["answer"],
            sources=result.get("sources", []),
            execution_metadata=execution_metadata,
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return assistant_msg


chat_service = ChatService()

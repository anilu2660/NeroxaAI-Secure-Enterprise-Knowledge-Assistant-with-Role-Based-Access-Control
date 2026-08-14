"""
RAG Routes

API endpoints for the RAG query interface.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.api.dependencies import get_current_user
from backend.audit.schemas import AuditLogCreate
from backend.audit.service import audit_service
from backend.database.session import get_db
from backend.models.user import User
from backend.rag.schemas import (
    QueryHealthResponse,
    QueryRequest,
    QueryResponse,
    SourceCitation,
)
from backend.rag.service import rag_service
from backend.utils.rate_limiter import rate_limit_guard

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])


@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Query the knowledge base",
    dependencies=[Depends(rate_limit_guard("query"))],
)
async def query_knowledge_base(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user_role = current_user.role_id
        user_department = current_user.department

        result = await rag_service.query(
            query=request.query,
            user_id=current_user.id,
            user_role=user_role,
            user_department=user_department,
            department_filter=request.department_filter,
            top_k=request.top_k,
            temperature=request.temperature,
        )

        sources = [
            SourceCitation(**src)
            for src in result["sources"]
        ]

        try:
            audit_service.log_event(
                db=db,
                event_data=AuditLogCreate(
                    event_type="query_executed",
                    user_id=current_user.id,
                    user_email=current_user.email,
                    user_role=user_role,
                    action=f"Executed query: '{request.query[:100]}'",
                    details={
                        "chunks": result["chunks_retrieved"],
                        "sources_count": len(sources),
                    },
                ),
            )
        except Exception as audit_err:
            logger.warning(
                "Failed to record query audit log: %s",
                str(audit_err),
            )

        return QueryResponse(
            query=result["query"],
            answer=result["answer"],
            sources=sources,
            model=result["model"],
            chunks_retrieved=result["chunks_retrieved"],
        )

    except RuntimeError as e:
        logger.error(
            "RAG query failed: %s",
            str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The knowledge base is temporarily unavailable. Please try again shortly.",
        ) from e
    except Exception as e:
        logger.error(
            "Unexpected error in RAG query: %s",
            str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your query.",
        ) from e


@router.post(
    "/stream",
    summary="Query the knowledge base with real-time token streaming",
    dependencies=[Depends(rate_limit_guard("query"))],
)
async def stream_knowledge_base(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    async def event_generator():
        try:
            async for chunk in rag_service.stream_query(
                query=request.query,
                user_id=current_user.id,
                user_role=current_user.role_id,
                user_department=current_user.department,
                department_filter=request.department_filter,
                top_k=request.top_k,
                temperature=request.temperature,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as err:
            logger.error(
                "SSE stream error: %s",
                str(err),
                exc_info=True,
            )
            yield (
                f"data: {json.dumps({'type': 'error', 'error': 'Streaming failed.'})}\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )


@router.get(
    "/health",
    response_model=QueryHealthResponse,
    summary="RAG pipeline health check",
)
async def rag_health_check():
    health = await rag_service.check_pipeline_health()
    return QueryHealthResponse(**health)

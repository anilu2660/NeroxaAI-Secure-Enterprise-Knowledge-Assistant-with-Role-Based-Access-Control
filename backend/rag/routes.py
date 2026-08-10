"""
RAG Routes

API endpoints for the RAG query interface.
Provides the main /query endpoint and pipeline health check.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from backend.rag.schemas import (
    QueryRequest,
    QueryResponse,
    SourceCitation,
    QueryHealthResponse,
)
from backend.rag.service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])


from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.audit.service import audit_service
from backend.audit.schemas import AuditLogCreate

from backend.utils.rate_limiter import rate_limit_guard

from backend.api.dependencies import get_current_user
from backend.models.user import User

@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Query the knowledge base",
    description=(
        "Submit a natural language query to the Enterprise RAG pipeline. "
        "Returns an AI-generated answer with source citations. "
        "Results are strictly filtered based on the authenticated user's role and department (RBAC)."
    ),
    dependencies=[Depends(rate_limit_guard("query"))],
)
async def query_knowledge_base(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Execute a RAG query against the enterprise knowledge base.
    Role and department are extracted from the verified JWT token to prevent spoofing.
    """
    try:
        # SECURITY GUARD: Extract role and department from verified JWT token, NOT client input
        user_role = current_user.role_id
        user_department = current_user.department

        result = await rag_service.query(
            query=request.query,
            user_role=user_role,
            user_department=user_department,
            department_filter=request.department_filter,
            top_k=request.top_k,
            temperature=request.temperature,
        )

        # Convert source dicts to SourceCitation models
        sources = [SourceCitation(**src) for src in result["sources"]]

        # Log query execution audit event
        try:
            audit_service.log_event(
                db=db,
                event_data=AuditLogCreate(
                    event_type="query_executed",
                    user_id=current_user.id,
                    user_email=current_user.email,
                    user_role=user_role,
                    action=f"Executed query: '{request.query[:100]}'",
                    details={"chunks": result["chunks_retrieved"], "sources_count": len(sources)},
                ),
            )
        except Exception as audit_err:
            logger.warning("Failed to record query audit log: %s", str(audit_err))

        return QueryResponse(
            query=result["query"],
            answer=result["answer"],
            sources=sources,
            model=result["model"],
            chunks_retrieved=result["chunks_retrieved"],
        )

    except RuntimeError as e:
        # SECURITY: Log full error internally, return generic message externally.
        # Prevents exposure of Ollama URL, model names, or internal stack traces.
        logger.error("RAG query failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The knowledge base is temporarily unavailable. Please try again shortly.",
        ) from e
    except Exception as e:
        logger.error("Unexpected error in RAG query: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your query.",
        ) from e


from fastapi.responses import StreamingResponse
import json


@router.post(
    "/stream",
    summary="Query the knowledge base with real-time token streaming",
    description="Submit a query and stream AI response tokens in real-time via Server-Sent Events (SSE).",
    dependencies=[Depends(rate_limit_guard("query"))],
)
async def stream_knowledge_base(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for low perceived latency.
    """
    user_role = current_user.role_id
    user_department = current_user.department

    async def event_generator():
        try:
            async for chunk in rag_service.stream_query(
                query=request.query,
                user_role=user_role,
                user_department=user_department,
                department_filter=request.department_filter,
                top_k=request.top_k,
                temperature=request.temperature,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as err:
            logger.error("SSE stream error: %s", str(err), exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': 'Streaming failed.'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get(
    "/health",
    response_model=QueryHealthResponse,
    summary="RAG pipeline health check",
    description="Check the health status of all RAG pipeline components.",
)
async def rag_health_check():
    """
    Check the health of the RAG pipeline components:
    - LLM (Ollama) connectivity and model availability
    - Vector database (Qdrant) connectivity
    - Embedding service status
    """
    health = await rag_service.check_pipeline_health()
    return QueryHealthResponse(**health)

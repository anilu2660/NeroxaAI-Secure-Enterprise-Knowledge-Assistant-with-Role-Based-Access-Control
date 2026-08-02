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


@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Query the knowledge base",
    description=(
        "Submit a natural language query to the Enterprise RAG pipeline. "
        "Returns an AI-generated answer with source citations. "
        "Results are filtered based on the user's role and department (RBAC)."
    ),
)
async def query_knowledge_base(
    request: QueryRequest,
    # TODO: Replace with actual auth dependency in Phase 2
    # current_user = Depends(get_current_user),
):
    """
    Execute a RAG query against the enterprise knowledge base.

    The pipeline:
    1. Embeds the query using Sentence Transformers
    2. Retrieves relevant documents filtered by user permissions (RBAC)
    3. Generates an answer using Ollama LLM
    4. Returns the answer with source citations
    """
    try:
        # Use role and department provided in request (or from JWT token when auth is enabled)
        user_role = request.user_role
        user_department = request.user_department

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

        return QueryResponse(
            query=result["query"],
            answer=result["answer"],
            sources=sources,
            model=result["model"],
            chunks_retrieved=result["chunks_retrieved"],
        )

    except RuntimeError as e:
        logger.error("RAG query failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"RAG pipeline error: {str(e)}",
        ) from e
    except Exception as e:
        logger.error("Unexpected error in RAG query: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your query.",
        ) from e


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

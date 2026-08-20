"""
RAG Schemas

Pydantic models for the RAG query request/response payloads.
Includes models for queries, answers with citations, and source references.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class QueryRequest(BaseModel):
    """Schema for incoming RAG query requests."""

    query: str = Field(
        ...,
        min_length=3,
        # SECURITY: 500 chars is sufficient for any enterprise query.
        # 2000-char queries + large top_k = expensive LLM context + potential DoS.
        max_length=500,
        description="The user's question to search the knowledge base.",
        examples=["What is our company's leave policy?"],
    )
    department_filter: str | None = Field(
        default=None,
        description="Optional department filter to narrow search scope.",
        examples=["HR", "Finance", "Engineering"],
    )
    # SECURITY NOTE: user_role and user_department are intentionally NOT accepted
    # from the client. They are always extracted from the verified JWT token server-side.
    top_k: int = Field(
        default=5,
        ge=1,
        # SECURITY: Cap at 10 to prevent resource exhaustion.
        # Each chunk adds ~500 chars to the LLM context window.
        le=10,
        description="Number of top relevant chunks to retrieve (max 10).",
    )
    temperature: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="LLM temperature (0.0 = deterministic factual QA, 1.0 = creative).",
    )


class SourceCitation(BaseModel):
    """Schema for a single source citation from the retrieved documents."""

    document_title: str = Field(
        ...,
        description="Title of the source document.",
    )
    department: str = Field(
        default="General",
        description="Department that owns the document.",
    )
    page_number: int | str = Field(
        default="N/A",
        description="Page number in the source document.",
    )


class QueryResponse(BaseModel):
    """Schema for RAG query responses with answer and citations."""

    query: str = Field(
        ...,
        description="The original user query.",
    )
    answer: str = Field(
        ...,
        description="The LLM-generated answer based on retrieved context.",
    )
    sources: list[SourceCitation] = Field(
        default_factory=list,
        description="List of source citations for the answer.",
    )
    model: str = Field(
        ...,
        description="The LLM model used to generate the response.",
    )
    chunks_retrieved: int = Field(
        default=0,
        description="Number of document chunks retrieved for context.",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of the response.",
    )


class QueryHealthResponse(BaseModel):
    """Schema for RAG pipeline health check response."""

    status: str = Field(..., description="Overall pipeline health status.")
    llm_status: dict = Field(
        default_factory=dict,
        description="LLM service health details.",
    )
    vector_db_status: str = Field(
        default="unknown",
        description="Vector database connection status.",
    )
    embedding_status: str = Field(
        default="unknown",
        description="Embedding service status.",
    )

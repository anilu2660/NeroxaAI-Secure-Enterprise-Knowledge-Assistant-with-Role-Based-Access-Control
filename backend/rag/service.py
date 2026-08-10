"""
RAG Pipeline Service

Orchestrates the full Retrieval-Augmented Generation pipeline:
1. Embed user query using Sentence Transformers
2. Metadata-filtered retrieval from Qdrant (with RBAC enforcement)
3. Prompt construction with retrieved context
4. LLM response generation via Ollama
5. Source citation formatting
"""

import asyncio
import logging
from backend.config import settings
from backend.llm.service import llm_service
from backend.embeddings.service import embedding_service
from backend.retriever.service import retriever_service

logger = logging.getLogger(__name__)


class RAGService:
    """
    Orchestrates the full RAG pipeline.

    Coordinates between the embedding service, retriever (Qdrant),
    and LLM (Ollama) to produce answers with citations while
    enforcing RBAC through metadata filtering.
    """

    def __init__(self):
        """Initialize RAG service with component services."""
        self.llm = llm_service
        self.embeddings = embedding_service
        self.retriever = retriever_service

    async def query(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
        top_k: int = 6,
        temperature: float = 0.7,
    ) -> dict:
        """
        Execute the full RAG pipeline.

        Args:
            query: The user's natural language question.
            user_role: The authenticated user's role (for RBAC filtering).
            user_department: The user's department (for RBAC filtering).
            department_filter: Optional additional department filter.
            top_k: Number of top relevant chunks to retrieve.
            temperature: LLM temperature for response generation.

        Returns:
            dict containing:
                - query: original query
                - answer: LLM-generated answer
                - sources: list of source citations
                - model: LLM model used
                - chunks_retrieved: number of chunks used
        """
        logger.info(
            "RAG pipeline started | query='%s' | role=%s | department=%s",
            query[:50],
            user_role,
            user_department,
        )

        # Step 0: SECURITY GUARD - Inspect for Prompt Injection / Jailbreak Attacks
        from backend.llm.prompts import detect_prompt_injection
        is_injection, signature = detect_prompt_injection(query)
        if is_injection:
            logger.warning(
                "Prompt Injection ATTEMPT DETECTED | query='%s' | signature='%s' | role=%s",
                query[:50],
                signature,
                user_role,
            )
            return {
                "query": query,
                "answer": (
                    "Security Alert: Your query contains input patterns that violate "
                    "enterprise safety policies. This request has been blocked and logged."
                ),
                "sources": [],
                "model": self.llm.model,
                "chunks_retrieved": 0,
            }

        # Step 1: Scale Enhancement: Embed user query in background threadpool
        query_embedding = await asyncio.to_thread(self.embeddings.embed_query, query)
        logger.debug("Query embedded successfully | dimension=%d", len(query_embedding))

        # Step 2: Retrieve relevant chunks with RBAC metadata filtering
        context_chunks = await self.retriever.search(
            query_embedding=query_embedding,
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
            top_k=top_k,
        )
        logger.info("Retrieved %d chunks from vector store", len(context_chunks))

        # Step 3: Handle case where no relevant documents are found
        if not context_chunks:
            logger.warning("No relevant chunks found for query: %s", query[:50])
            return {
                "query": query,
                "answer": (
                    "I could not find any relevant documents in the knowledge base "
                    "that match your query and access permissions. Please try "
                    "rephrasing your question or contact your administrator."
                ),
                "sources": [],
                "model": self.llm.model,
                "chunks_retrieved": 0,
            }

        # Step 4: Generate LLM response with retrieved context
        llm_response = await self.llm.agenerate_response(
            query=query,
            context_chunks=context_chunks,
            temperature=temperature,
        )

        logger.info(
            "RAG pipeline completed | chunks=%d | model=%s",
            len(context_chunks),
            llm_response["model"],
        )

        # Step 5: Return formatted response with citations
        return {
            "query": query,
            "answer": llm_response["answer"],
            "sources": llm_response["sources"],
            "model": llm_response["model"],
            "chunks_retrieved": len(context_chunks),
        }

    async def check_pipeline_health(self) -> dict:
        """
        Check the health of all RAG pipeline components.

        Returns:
            dict with health status of LLM, vector DB, and embedding service.
        """
        llm_health = self.llm.check_health()
        retriever_health = await self.retriever.check_health()
        embedding_health = self.embeddings.check_health()

        all_healthy = (
            llm_health.get("status") == "healthy"
            and retriever_health.get("status") == "healthy"
            and embedding_health.get("status") == "healthy"
        )

        return {
            "status": "healthy" if all_healthy else "degraded",
            "llm_status": llm_health,
            "vector_db_status": retriever_health.get("status", "unknown"),
            "embedding_status": embedding_health.get("status", "unknown"),
        }


# Singleton instance for dependency injection
rag_service = RAGService()

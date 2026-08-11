"""
RAG Pipeline Service

Orchestrates the full Retrieval-Augmented Generation pipeline:
1. Query Cache lookup (RBAC-scoped)
2. Prompt Injection detection & guardrails
3. Hybrid Search (Dense + BM25 Sparse with RRF fusion)
4. Cross-Encoder Reranking
5. Prompt construction with top reranked context
6. LLM response generation or token streaming via Ollama
7. Source citation formatting & Cache store
"""

import asyncio
import logging
from backend.config import settings
from backend.llm.service import llm_service
from backend.embeddings.service import embedding_service
from backend.retriever.service import retriever_service
from backend.retriever.reranker import reranker_service
from backend.cache.service import semantic_cache

logger = logging.getLogger(__name__)


class RAGService:
    """
    Orchestrates the full RAG pipeline with Hybrid Search, Reranking, and Semantic Caching.
    """

    def __init__(self):
        """Initialize RAG service with component services."""
        self.llm = llm_service
        self.embeddings = embedding_service
        self.retriever = retriever_service
        self.reranker = reranker_service
        self.cache = semantic_cache


    def _expand_query(self, query: str) -> str:
        """
        Enrich queries with domain synonyms to bridge vocabulary gaps during retrieval.
        """
        q_lower = query.lower()
        expansions = []
        if "certifying officer" in q_lower or "invoice" in q_lower or "payment" in q_lower:
            expansions.append("verifying passing scrutiny of bills vouchers sanctioning authority")
        if "imprest" in q_lower:
            expansions.append("advance cash limit surrender petty cash")

        if expansions:
            return f"{query} {' '.join(expansions)}"
        return query

    def _decompose_query(self, query: str) -> list[str]:
        """
        Decompose complex multi-part enterprise queries into targeted sub-queries.
        """
        import re
        sub_queries = [query]
        if len(query) > 60 and (" and " in query.lower() or " as well as " in query.lower() or " versus " in query.lower()):
            parts = re.split(r"\b(and|as well as|versus)\b", query, flags=re.IGNORECASE)
            valid_parts = [p.strip() for p in parts if len(p.strip()) > 15 and p.lower() not in ("and", "as well as", "versus")]
            if len(valid_parts) > 1:
                sub_queries.extend(valid_parts)
        return sub_queries[:3]

    async def _retrieve_and_rerank(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None,
        top_k: int,
    ) -> list[dict]:
        """
        Execute Query Decomposition -> Hybrid Search (Dense + Sparse RRF) -> Parent Context Resolution -> Deduplication -> Cross-Encoder Reranking.
        """
        sub_queries = self._decompose_query(query)
        all_raw_chunks = []
        seen_chunks = set()

        # Step 1 & 2: Multi-Query Hybrid Search (preserves dense + sparse RRF retriever!)
        for sub_q in sub_queries:
            search_query = self._expand_query(sub_q)
            q_emb = await asyncio.to_thread(self.embeddings.embed_query, sub_q)
            candidate_k = max(top_k * 3, 15)

            chunks = await self.retriever.search(
                query_embedding=q_emb,
                user_role=user_role,
                user_department=user_department,
                department_filter=department_filter,
                top_k=candidate_k,
                query_text=search_query,
            )

            for c in chunks:
                key = f"{c.get('document_id')}:{c.get('page_number')}:{c.get('content')[:50]}"
                if key not in seen_chunks:
                    seen_chunks.add(key)
                    all_raw_chunks.append(c)

        if not all_raw_chunks:
            return []

        # Step 3: Parent Context Resolution & Deduplication
        parent_seen = set()
        resolved_chunks = []
        for c in all_raw_chunks:
            parent_id = c.get("parent_id")
            if parent_id and c.get("parent_content"):
                if parent_id not in parent_seen:
                    parent_seen.add(parent_id)
                    parent_chunk = dict(c)
                    parent_chunk["content"] = c["parent_content"]
                    resolved_chunks.append(parent_chunk)
            else:
                resolved_chunks.append(c)

        # Step 4: Cross-Encoder Reranking with original precision query
        reranked_chunks = await self.reranker.async_rerank(query, resolved_chunks)
        return reranked_chunks[:top_k]

    async def query(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
        top_k: int = 5,
        temperature: float = 0.7,
    ) -> dict:
        """
        Execute full RAG pipeline (Cached -> Injection Check -> Hybrid Search -> Rerank -> LLM).
        """
        # Check Semantic Cache
        cached_result = self.cache.get(query, user_role, user_department)
        if cached_result:
            logger.info("Returning semantic cached RAG response for query '%s'", query[:40])
            return cached_result

        logger.info(
            "RAG query started | query='%s' | role=%s | department=%s",
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

        # Step 1 & 2: Hybrid Search + Rerank
        context_chunks = await self._retrieve_and_rerank(
            query=query,
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
            top_k=top_k,
        )

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

        # Step 3: LLM Generation
        llm_response = await self.llm.agenerate_response(
            query=query,
            context_chunks=context_chunks,
            temperature=temperature,
        )

        result = {
            "query": query,
            "answer": llm_response["answer"],
            "sources": llm_response["sources"],
            "model": llm_response["model"],
            "chunks_retrieved": len(context_chunks),
        }

        # Store in Semantic Cache
        self.cache.set(
            query=query,
            answer=result["answer"],
            sources=result["sources"],
            model=result["model"],
            chunks_retrieved=result["chunks_retrieved"],
            user_role=user_role,
            user_department=user_department,
        )
        return result

    async def stream_query(
        self,
        query: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
        top_k: int = 5,
        temperature: float = 0.7,
    ):
        """
        Async generator for streaming RAG responses token-by-token.
        """
        # Step 0: Prompt Injection Check
        from backend.llm.prompts import detect_prompt_injection
        is_injection, signature = detect_prompt_injection(query)
        if is_injection:
            yield {
                "type": "error",
                "error": "Security Alert: Query contains input patterns that violate enterprise safety policies.",
            }
            return

        # Step 1 & 2: Hybrid Search + Rerank
        context_chunks = await self._retrieve_and_rerank(
            query=query,
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
            top_k=top_k,
        )

        if not context_chunks:
            yield {
                "type": "error",
                "error": "No relevant authorized documents found in the knowledge base.",
            }
            return

        # Stream LLM tokens asynchronously
        async for chunk in self.llm.astream_response(
            query=query,
            context_chunks=context_chunks,
            temperature=temperature,
        ):
            yield chunk

    async def check_pipeline_health(self) -> dict:
        """
        Check health of LLM, vector DB, reranker, and embedding services.
        """
        llm_health = self.llm.check_health()
        retriever_health = await self.retriever.check_health()
        embedding_health = self.embeddings.check_health()
        reranker_health = self.reranker.check_health()

        all_healthy = (
            llm_health.get("status") == "healthy"
            and retriever_health.get("status") == "healthy"
            and embedding_health.get("status") == "healthy"
            and reranker_health.get("status") == "healthy"
        )

        return {
            "status": "healthy" if all_healthy else "degraded",
            "llm_status": llm_health,
            "vector_db_status": retriever_health.get("status", "unknown"),
            "embedding_status": embedding_health.get("status", "unknown"),
            "reranker_status": reranker_health.get("status", "unknown"),
        }


# Singleton instance
rag_service = RAGService()

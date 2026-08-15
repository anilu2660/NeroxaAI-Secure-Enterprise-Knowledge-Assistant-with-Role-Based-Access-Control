"""
RAG Pipeline Service

Orchestrates query expansion, hybrid retrieval, reranking, section-context
expansion, generation, and user-scoped caching.
"""

import asyncio
import logging
import re

from backend.config import settings
from backend.llm.service import llm_service
from backend.embeddings.service import embedding_service
from backend.retriever.service import retriever_service
from backend.retriever.reranker import reranker_service
from backend.cache.service import semantic_cache

logger = logging.getLogger(__name__)

_CONVERSATIONAL_PATTERNS = re.compile(
    r"^(hello|hi|hey|howdy|greetings|good\s+(morning|afternoon|evening|day)|what'?s?\s+up|sup)|"
    r"(how\s+are\s+you|how\s+do\s+you\s+do|nice\s+to\s+(meet|see)\s+you|pleased\s+to\s+meet)|"
    r"(what\s+(can\s+you\s+do|are\s+you\s+capable|do\s+you\s+do|can\s+you\s+help|is\s+your\s+purpose)|who\s+are\s+you|tell\s+me\s+about\s+yourself|introduce\s+yourself)|"
    r"(thank(s|\s+you)|bye|goodbye|see\s+you|take\s+care|have\s+a\s+good)|"
    r"(can\s+you\s+help\s+me\??$|help\s*\??$|what\s+can\s+i\s+ask\??$)|"
    r"(nice|okay|ok|sure|great|wow|cool|awesome|understood|got\s+it)\s*\.?$",
    re.IGNORECASE,
)

_DEPT_KEYWORDS = re.compile(
    r"\b(policy|procedure|finance|hr|human\s+resource|engineering|sales|marketing|operations|payroll|budget|invoice|compliance|audit|report|document|leave|holiday|regulation|guideline|rule|protocol|standard|memo|circular|approval|benefit)s?\b",
    re.IGNORECASE,
)


def is_conversational_query(query: str) -> bool:
    stripped = query.strip()
    word_count = len(stripped.split())
    if _DEPT_KEYWORDS.search(stripped):
        return False
    return word_count <= 6 and bool(_CONVERSATIONAL_PATTERNS.search(stripped))


class RAGService:
    def __init__(self):
        self.llm = llm_service
        self.embeddings = embedding_service
        self.retriever = retriever_service
        self.reranker = reranker_service
        self.cache = semantic_cache

    def _expand_query(self, query: str) -> str:
        """Add domain synonyms without replacing the user's original wording."""
        q_lower = query.lower()
        expansions: list[str] = []

        if any(term in q_lower for term in ("certifying officer", "invoice", "payment", "bill", "voucher")):
            expansions.append("verifying passing scrutiny bills vouchers sanctioning authority payment")
        if "imprest" in q_lower:
            expansions.append("advance cash limit surrender petty cash")
        if any(term in q_lower for term in ("new source", "new source of income", "source of income", "revenue source")):
            expansions.append("establish source of revenue university funds approval authorization financial implications proposal")
        if any(term in q_lower for term in ("financial implication", "financial implications", "cost implication")):
            expansions.append("financial impact cost budget expenditure funding")

        return f"{query} {' '.join(expansions)}" if expansions else query

    def _decompose_query(self, query: str) -> list[str]:
        """Create a small set of focused retrieval queries for multi-part questions."""
        sub_queries = [query]
        if len(query) > 60 and re.search(r"\b(and|as well as|versus|while|plus)\b", query, re.IGNORECASE):
            parts = re.split(r"\b(and|as well as|versus|while|plus)\b", query, flags=re.IGNORECASE)
            valid_parts = [
                p.strip()
                for p in parts
                if len(p.strip()) > 15
                and p.lower() not in ("and", "as well as", "versus", "while", "plus")
            ]
            if len(valid_parts) > 1:
                sub_queries.extend(valid_parts)
        return sub_queries[:3]

    @staticmethod
    def _chunk_identity(chunk: dict) -> str:
        return ":".join(
            str(chunk.get(key, ""))
            for key in ("document_id", "page_number", "parent_id", "chunk_index")
        )

    @staticmethod
    def _add_parent_context(chunks: list[dict]) -> list[dict]:
        """Expand only after reranking, preserving the precise ranked chunk."""
        resolved = []
        for chunk in chunks:
            enriched = dict(chunk)
            precise = chunk.get("content") or chunk.get("raw_text", "")
            parent = chunk.get("parent_content", "")
            if parent and parent != precise:
                enriched["retrieved_content"] = precise
                enriched["content"] = parent
            resolved.append(enriched)
        return resolved

    async def _retrieve_and_rerank(
        self,
        query: str,
        user_id: str,
        user_role: str,
        user_department: str,
        department_filter: str | None,
        top_k: int,
    ) -> list[dict]:
        sub_queries = self._decompose_query(query)
        all_raw_chunks: list[dict] = []
        seen_chunks: set[str] = set()

        for sub_q in sub_queries:
            search_query = self._expand_query(sub_q)
            q_emb = await asyncio.to_thread(
                self.embeddings.embed_query,
                search_query,
            )
            candidate_k = max(top_k * 4, 20)
            chunks = await self.retriever.search(
                query_embedding=q_emb,
                user_role=user_role,
                user_department=user_department,
                user_id=user_id,
                department_filter=department_filter,
                top_k=candidate_k,
                query_text=search_query,
            )

            for chunk in chunks:
                key = self._chunk_identity(chunk)
                if key not in seen_chunks:
                    seen_chunks.add(key)
                    all_raw_chunks.append(chunk)

        if not all_raw_chunks:
            return []

        reranked_chunks = await self.reranker.async_rerank(query, all_raw_chunks)
        reranked_chunks = reranked_chunks[:top_k]
        return self._add_parent_context(reranked_chunks)

    async def query(
        self,
        query: str,
        user_id: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
        top_k: int = 5,
        temperature: float = 0.7,
    ) -> dict:
        query = query.strip()
        if not query or len(query) > 500:
            raise ValueError("Query must contain between 1 and 500 characters.")

        from backend.llm.prompts import detect_prompt_injection
        is_injection, signature = detect_prompt_injection(query)
        if is_injection:
            logger.warning("Prompt injection attempt detected | signature=%s | user_id=%s", signature, user_id)
            return {
                "query": query,
                "answer": "Security Alert: Your query contains input patterns that violate enterprise safety policies. This request has been blocked and logged.",
                "sources": [],
                "model": self.llm.model,
                "chunks_retrieved": 0,
                "cached": False,
            }

        cached_result = await self.cache.get(
            query=query,
            user_id=user_id,
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
        )
        if cached_result:
            return cached_result

        logger.info(
            "RAG query started | role=%s | department=%s | user_id=%s | department_filter=%s",
            user_role,
            user_department,
            user_id,
            department_filter,
        )

        if is_conversational_query(query):
            try:
                llm_response = await self.llm.agenerate_conversational_response(query=query, temperature=temperature)
                return {
                    "query": query,
                    "answer": llm_response["answer"],
                    "sources": [],
                    "model": llm_response["model"],
                    "chunks_retrieved": 0,
                    "cached": False,
                }
            except Exception as conv_err:
                logger.warning("Conversational LLM call failed: %s", conv_err)

        context_chunks = await self._retrieve_and_rerank(
            query=query,
            user_id=user_id,
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
            top_k=top_k,
        )

        if not context_chunks:
            return {
                "query": query,
                "answer": "I could not find any relevant documents that you are authorized to access. Please try rephrasing your question or contact your administrator if you need additional access.",
                "sources": [],
                "model": self.llm.model,
                "chunks_retrieved": 0,
                "cached": False,
            }

        llm_response = await self.llm.agenerate_response(query=query, context_chunks=context_chunks, temperature=temperature)
        result = {
            "query": query,
            "answer": llm_response["answer"],
            "sources": llm_response["sources"],
            "model": llm_response["model"],
            "chunks_retrieved": len(context_chunks),
            "cached": False,
        }

        await self.cache.set(
            query=query,
            answer=result["answer"],
            sources=result["sources"],
            model=result["model"],
            chunks_retrieved=result["chunks_retrieved"],
            user_id=user_id,
            user_role=user_role,
            user_department=user_department,
            department_filter=department_filter,
        )
        return result

    async def stream_query(
        self,
        query: str,
        user_id: str,
        user_role: str,
        user_department: str,
        department_filter: str | None = None,
        top_k: int = 5,
        temperature: float = 0.7,
    ):
        from backend.llm.prompts import detect_prompt_injection
        query = query.strip()
        if not query or len(query) > 500:
            yield {"type": "error", "error": "Query must contain between 1 and 500 characters."}
            return

        is_injection, signature = detect_prompt_injection(query)
        if is_injection:
            logger.warning("Prompt injection attempt detected in stream | signature=%s | user_id=%s", signature, user_id)
            yield {"type": "error", "error": "Security Alert: Query contains input patterns that violate enterprise safety policies."}
            return

        context_chunks = await self._retrieve_and_rerank(query, user_id, user_role, user_department, department_filter, top_k)
        if not context_chunks:
            yield {"type": "error", "error": "No relevant authorized documents found in the knowledge base."}
            return

        async for chunk in self.llm.astream_response(query=query, context_chunks=context_chunks, temperature=temperature):
            yield chunk

    async def check_pipeline_health(self) -> dict:
        llm_health = self.llm.check_health()
        retriever_health = await self.retriever.check_health()
        embedding_health = self.embeddings.check_health()
        reranker_health = self.reranker.check_health()
        cache_healthy = await self.cache.health_check()
        all_healthy = (
            llm_health.get("status") == "healthy"
            and retriever_health.get("status") == "healthy"
            and embedding_health.get("status") == "healthy"
            and reranker_health.get("status") == "healthy"
            and cache_healthy
        )
        return {
            "status": "healthy" if all_healthy else "degraded",
            "llm_status": llm_health,
            "vector_db_status": retriever_health.get("status", "unknown"),
            "embedding_status": embedding_health.get("status", "unknown"),
            "reranker_status": reranker_health.get("status", "unknown"),
            "cache_status": "healthy" if cache_healthy else "unavailable",
        }


rag_service = RAGService()

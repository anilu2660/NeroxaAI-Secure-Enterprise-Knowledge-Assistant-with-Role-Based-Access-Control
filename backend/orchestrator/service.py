import logging

from backend.llm.service import llm_service
from backend.query.rewriter import query_rewriter
from backend.rag.service import rag_service
from backend.router.schemas import QueryRoute, QueryRoutingDecision
from backend.router.service import query_router

logger = logging.getLogger(__name__)


class QueryOrchestrator:
    def __init__(self):
        self.router = query_router
        self.rewriter = query_rewriter
        self.rag = rag_service
        self.llm = llm_service

    async def process(
        self,
        query: str,
        user_id: str,
        user_role: str,
        user_department: str,
        conversation_history: str = "",
        department_filter: str | None = None,
        top_k: int = 5,
        temperature: float = 0.7,
    ) -> dict:
        decision = await self.router.route(query)

        logger.info(
            "Query routed | route=%s | confidence=%.2f | user_id=%s",
            decision.route.value,
            decision.confidence,
            user_id,
        )

        if decision.route == QueryRoute.CASUAL:
            response = await self.llm.agenerate_conversational_response(
                query=query,
                temperature=temperature,
            )
            return self._response(query, decision, response["answer"], response["model"], [])

        enterprise_query = query
        if decision.requires_rag:
            enterprise_query = await self.rewriter.rewrite(
                query=query,
                conversation_history=conversation_history,
            )

        rag_result = None
        if decision.requires_rag:
            rag_result = await self.rag.query(
                query=enterprise_query,
                user_id=user_id,
                user_role=user_role,
                user_department=user_department,
                department_filter=department_filter,
                top_k=top_k,
                temperature=temperature,
            )

        if decision.requires_web:
            return self._web_not_configured_response(
                query=query,
                decision=decision,
                rag_result=rag_result,
            )

        if rag_result is not None:
            rag_result["route"] = decision.route.value
            rag_result["route_confidence"] = decision.confidence
            rag_result["rewritten_query"] = enterprise_query
            return rag_result

        return self._response(
            query=query,
            decision=decision,
            answer="I could not determine a supported processing path for this request.",
            model=self.llm.model,
            sources=[],
        )

    def _response(
        self,
        query: str,
        decision: QueryRoutingDecision,
        answer: str,
        model: str,
        sources: list[dict],
    ) -> dict:
        return {
            "query": query,
            "answer": answer,
            "sources": sources,
            "model": model,
            "chunks_retrieved": 0,
            "route": decision.route.value,
            "route_confidence": decision.confidence,
        }

    def _web_not_configured_response(
        self,
        query: str,
        decision: QueryRoutingDecision,
        rag_result: dict | None,
    ) -> dict:
        if rag_result is not None and decision.route == QueryRoute.HYBRID:
            answer = (
                f"{rag_result['answer']}\n\n"
                "Web search is not enabled yet, so I cannot verify current public information."
            )
            result = dict(rag_result)
            result.update(
                {
                    "query": query,
                    "answer": answer,
                    "route": decision.route.value,
                    "route_confidence": decision.confidence,
                    "web_search_status": "not_configured",
                }
            )
            return result

        return self._response(
            query=query,
            decision=decision,
            answer=(
                "This question requires current public web information, but web search "
                "is not configured yet."
            ),
            model=self.llm.model,
            sources=[],
        ) | {"web_search_status": "not_configured"}


query_orchestrator = QueryOrchestrator()

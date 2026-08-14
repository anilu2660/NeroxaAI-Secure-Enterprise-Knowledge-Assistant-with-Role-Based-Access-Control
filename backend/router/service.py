import json
import logging
import re

from backend.llm.service import llm_service
from backend.router.schemas import QueryRoute, QueryRoutingDecision

logger = logging.getLogger(__name__)


class QueryRouter:
    def __init__(self):
        self.llm = llm_service

    def _heuristic_route(self, query: str) -> QueryRoutingDecision | None:
        text = query.strip().lower()
        words = set(re.findall(r"[a-z0-9']+", text))

        casual_patterns = (
            r"^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|bye)\b",
            r"\bhow are you\b",
            r"\bwho are you\b",
            r"\bwhat can you do\b",
        )
        if any(re.search(pattern, text) for pattern in casual_patterns):
            return QueryRoutingDecision(
                route=QueryRoute.CASUAL,
                confidence=0.99,
                reason="Recognized conversational request.",
            )

        enterprise_terms = {
            "company", "enterprise", "internal", "employee", "policy",
            "procedure", "finance", "finance", "hr", "payroll", "leave",
            "department", "invoice", "budget", "compliance", "audit",
            "document", "handbook", "guideline", "approval", "benefit",
            "reimbursement", "travel", "internal", "organization",
        }
        web_terms = {
            "latest", "today", "current", "recent", "news", "weather",
            "stock", "price", "market", "2026", "yesterday", "breaking",
            "live", "now", "currently",
        }

        enterprise_hit = bool(words & enterprise_terms)
        web_hit = bool(words & web_terms)

        if enterprise_hit and web_hit:
            return QueryRoutingDecision(
                route=QueryRoute.HYBRID,
                confidence=0.78,
                reason="Query contains both enterprise and current-information signals.",
                requires_rag=True,
                requires_web=True,
            )

        if enterprise_hit:
            return QueryRoutingDecision(
                route=QueryRoute.ENTERPRISE,
                confidence=0.82,
                reason="Query contains enterprise knowledge signals.",
                requires_rag=True,
            )

        if web_hit:
            return QueryRoutingDecision(
                route=QueryRoute.WEB,
                confidence=0.82,
                reason="Query contains current-information signals.",
                requires_web=True,
            )

        return None

    async def route(self, query: str) -> QueryRoutingDecision:
        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        heuristic = self._heuristic_route(query)
        if heuristic and heuristic.confidence >= 0.95:
            return heuristic

        prompt = f"""
Classify the user's query into exactly one route: casual, enterprise, web, or hybrid.

casual: greetings, small talk, general conversation, or simple non-current questions.
enterprise: questions that require the organization's private/internal knowledge base.
web: questions that require current, live, recent, or public internet information.
hybrid: questions that require both private enterprise knowledge and current web information.

Return JSON only with this schema:
{{
  "route": "casual|enterprise|web|hybrid",
  "confidence": 0.0,
  "reason": "short reason"
}}

User query:
{query}
""".strip()

        try:
            response = await self.llm.generate(
                prompt=prompt,
                temperature=0.0,
                max_tokens=150,
            )
            text = response if isinstance(response, str) else str(response)
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if not match:
                raise ValueError("Router returned no JSON object.")

            data = json.loads(match.group(0))
            decision = QueryRoutingDecision.model_validate(data)

            if decision.route == QueryRoute.CASUAL:
                decision.requires_rag = False
                decision.requires_web = False
            elif decision.route == QueryRoute.ENTERPRISE:
                decision.requires_rag = True
                decision.requires_web = False
            elif decision.route == QueryRoute.WEB:
                decision.requires_rag = False
                decision.requires_web = True
            elif decision.route == QueryRoute.HYBRID:
                decision.requires_rag = True
                decision.requires_web = True

            return decision

        except Exception as exc:
            logger.warning("LLM query routing failed: %s", str(exc))
            return QueryRoutingDecision(
                route=QueryRoute.ENTERPRISE,
                confidence=0.51,
                reason="Router fallback; enterprise retrieval is the safer default for an enterprise assistant.",
                requires_rag=True,
            )


query_router = QueryRouter()

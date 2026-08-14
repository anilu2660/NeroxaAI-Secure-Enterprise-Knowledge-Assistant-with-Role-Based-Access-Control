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

        calculator_pattern = re.fullmatch(r"[\d\s+\-*/%.()]+", text)
        if calculator_pattern and any(char.isdigit() for char in text):
            return QueryRoutingDecision(
                route=QueryRoute.TOOL,
                confidence=0.99,
                reason="Query is a pure arithmetic expression.",
                requires_tool=True,
                tool_name="calculator",
            )

        multi_step_signals = (
            ("according to" in text and ("calculate" in text or "compute" in text)),
            ("policy" in text and ("calculate" in text or "percentage" in text or "%" in text)),
            ("latest" in text and ("our" in text or "company" in text or "internal" in text)),
            ("search" in text and "then" in text),
            ("find" in text and "calculate" in text),
        )
        if any(multi_step_signals):
            return QueryRoutingDecision(
                route=QueryRoute.AGENT,
                confidence=0.94,
                reason="Query requires multiple dependent retrieval, web, or tool steps.",
                requires_agent=True,
            )

        enterprise_terms = {
            "company", "enterprise", "internal", "employee", "policy",
            "procedure", "finance", "hr", "payroll", "leave", "department",
            "invoice", "budget", "compliance", "audit", "document", "handbook",
            "guideline", "approval", "benefit", "reimbursement", "travel",
            "organization",
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
        if heuristic and heuristic.confidence >= 0.94:
            return heuristic

        prompt = f"""
Classify the user's query into exactly one route: casual, enterprise, web, hybrid, tool, or agent.

casual: normal conversation with no external retrieval.
enterprise: organization's private/internal knowledge base.
web: current, live, recent, or public internet information.
hybrid: both private enterprise knowledge and current web information.
tool: one registered application tool is sufficient.
agent: multiple dependent steps are required, such as RAG followed by a calculator, or web search followed by a calculation.

Never invent a tool. Only classify as tool or agent when registered capabilities are clearly required.
Prefer agent when the user explicitly asks for a sequence of dependent actions.

Return JSON only:
{{
  "route": "casual|enterprise|web|hybrid|tool|agent",
  "confidence": 0.0,
  "reason": "short reason",
  "requires_tool": false,
  "tool_name": null,
  "requires_agent": false
}}

User query:
{query}
""".strip()

        try:
            response = await self.llm.generate_text(
                prompt=prompt,
                temperature=0.0,
                max_tokens=250,
            )
            match = re.search(r"\{.*\}", response, re.DOTALL)
            if not match:
                raise ValueError("Router returned no JSON object.")

            decision = QueryRoutingDecision.model_validate(json.loads(match.group(0)))

            if decision.route == QueryRoute.CASUAL:
                decision.requires_rag = decision.requires_web = decision.requires_tool = decision.requires_agent = False
            elif decision.route == QueryRoute.ENTERPRISE:
                decision.requires_rag = True
                decision.requires_web = decision.requires_tool = decision.requires_agent = False
            elif decision.route == QueryRoute.WEB:
                decision.requires_web = True
                decision.requires_rag = decision.requires_tool = decision.requires_agent = False
            elif decision.route == QueryRoute.HYBRID:
                decision.requires_rag = decision.requires_web = True
                decision.requires_tool = decision.requires_agent = False
            elif decision.route == QueryRoute.TOOL:
                decision.requires_tool = True
                decision.requires_rag = decision.requires_web = decision.requires_agent = False
            elif decision.route == QueryRoute.AGENT:
                decision.requires_agent = True
                decision.requires_rag = decision.requires_web = decision.requires_tool = False

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

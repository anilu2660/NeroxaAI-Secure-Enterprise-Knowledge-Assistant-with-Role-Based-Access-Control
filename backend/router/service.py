import json
import logging
import re

from backend.llm.service import llm_service
from backend.router.schemas import QueryCategory, QueryRoute, QueryRoutingDecision

logger = logging.getLogger(__name__)


class QueryRouter:
    """
    2-Stage Hierarchical Query Router:
    
    Query
      │
      ▼
    Is it current/live?
        /          \
      YES           NO
       │             │
      WEB      Could enterprise KB answer this?
                    /          \
                  YES           NO
                   │             │
                  RAG       GENERAL LLM
    """

    def __init__(self):
        self.llm = llm_service

    def _heuristic_route(self, query: str) -> QueryRoutingDecision | None:
        text = query.strip().lower()
        words = set(re.findall(r"[a-z0-9']+", text))

        # Check for explicit arithmetic / tool request
        calculator_pattern = re.fullmatch(r"[\d\s+\-*/%.()]+", text)
        if calculator_pattern and any(char.isdigit() for char in text):
            return QueryRoutingDecision(
                category=QueryCategory.GENERAL_KNOWLEDGE,
                route=QueryRoute.TOOL,
                confidence=0.99,
                reason="Query is a pure arithmetic calculation.",
                requires_tool=True,
                tool_name="calculator",
            )

        # Check multi-step agent request
        multi_step_signals = (
            ("according to" in text and ("calculate" in text or "compute" in text)),
            ("policy" in text and ("calculate" in text or "percentage" in text or "%" in text)),
            ("latest" in text and ("our" in text or "company" in text or "internal" in text)),
            ("search" in text and "then" in text),
            ("find" in text and "calculate" in text),
        )
        if any(multi_step_signals):
            return QueryRoutingDecision(
                category=QueryCategory.INTERNAL_KNOWLEDGE,
                route=QueryRoute.AGENT,
                confidence=0.94,
                reason="Multi-step internal retrieval and tool execution required.",
                requires_agent=True,
            )

        # Enterprise internal knowledge terms
        enterprise_terms = {
            "company", "enterprise", "internal", "employee", "policy",
            "procedure", "finance", "hr", "payroll", "leave", "department",
            "invoice", "budget", "compliance", "audit", "document", "handbook",
            "guideline", "approval", "benefit", "reimbursement", "travel",
            "organization", "portal", "salary", "onboarding",
        }
        could_enterprise_answer = bool(words & enterprise_terms)

        # Step 1: Is it current/live/real-world information or public entity search?
        current_info_patterns = [
            r"\b(today|yesterday|tomorrow|weather|breaking news|live score|news|election|winner)\b",
            r"\b(stock price|market price|crypto price|exchange rate)\b",
            r"\b(2024|2025|2026)\b",
            r"\b(current|currently|present|latest|recent|now)\b",
            r"\bwho is (the )?(current|present|latest)?\s*(chief justice|prime minister|president|governor|minister|chief minister|ceo|director|head|chairman|leader|judge|cji)\b",
            r"\b(chief justice|prime minister|president of|governor of|supreme court|parliament|cabinet)\b",
        ]
        is_current_live = any(re.search(pattern, text) for pattern in current_info_patterns)

        if is_current_live and could_enterprise_answer:
            return QueryRoutingDecision(
                category=QueryCategory.CURRENT_INFORMATION,
                route=QueryRoute.HYBRID,
                confidence=0.90,
                reason="Query requires internal enterprise knowledge and live external search.",
                requires_rag=True,
                requires_web=True,
            )

        if is_current_live:
            return QueryRoutingDecision(
                category=QueryCategory.CURRENT_INFORMATION,
                route=QueryRoute.WEB,
                confidence=0.95,
                reason="Step 1: Is it current/live/public information? -> YES -> Route to WEB.",
                requires_web=True,
                requires_rag=False,
            )

        # Step 2: Could enterprise KB answer this?
        if could_enterprise_answer:
            return QueryRoutingDecision(
                category=QueryCategory.INTERNAL_KNOWLEDGE,
                route=QueryRoute.ENTERPRISE,
                confidence=0.90,
                reason="Step 2: Could enterprise KB answer this? -> YES -> Route to RAG.",
                requires_rag=True,
                requires_web=False,
            )

        # Conversational greetings and bot self-identity ONLY
        casual_patterns = (
            r"^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening|thanks|thank you|bye|goodbye|see you)\b",
            r"^(how are you|how do you do|nice to meet you)\b",
            r"^(who are you|what is your name|tell me about yourself|what can you do|help)\b",
        )
        if any(re.search(pattern, text) for pattern in casual_patterns):
            return QueryRoutingDecision(
                category=QueryCategory.GENERAL_KNOWLEDGE,
                route=QueryRoute.CASUAL,
                confidence=0.99,
                reason="Step 2: Conversational greeting/identity -> GENERAL LLM (casual).",
                requires_rag=False,
                requires_web=False,
            )

        # Short/Ambiguous single terms default to RAG for safety
        if len(words) <= 2:
            return QueryRoutingDecision(
                category=QueryCategory.AMBIGUOUS,
                route=QueryRoute.ENTERPRISE,
                confidence=0.80,
                reason="Step 2: Ambiguous/short query -> Searching internal enterprise KB first.",
                requires_rag=True,
                requires_web=False,
            )

        return None

    async def route(self, query: str) -> QueryRoutingDecision:
        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        heuristic = self._heuristic_route(query)
        if heuristic and heuristic.confidence >= 0.75:
            return heuristic

        prompt = f"""
Evaluate the query following this EXACT 2-step decision tree:

                    Query
                      │
                      ▼
             Is it current/live/real-world search?
                 /          \\
               YES           NO
                │             │
               WEB      Could enterprise KB answer this?
                            /          \\
                          YES           NO
                           │             │
                          RAG       GENERAL LLM (Casual/Chit-chat ONLY)

Decision Rules:
- STEP 1: Is it current/live/real-world public knowledge or external facts?
  - YES -> category: "CURRENT_INFORMATION", route: "web" (requires_web: true, requires_rag: false)
    (e.g., current chief justice, prime ministers, presidents, public officials, live news, weather, stock prices, external organizations, latest 2025/2026 events).
  - NO  -> Proceed to STEP 2.

- STEP 2: Could enterprise KB answer this?
  - YES -> category: "INTERNAL_KNOWLEDGE", route: "enterprise" (requires_rag: true, requires_web: false)
    (e.g., company policies, HR rules, reimbursement, department guidelines, employee documents, internal procedures).
  - NO  -> category: "GENERAL_KNOWLEDGE", route: "casual" (requires_rag: false, requires_web: false)
    (STRICTLY for greetings, chit-chat, bot identity, simple arithmetic, or casual conversation).

- AMBIGUOUS QUERIES: If the query is vague or ambiguous, treat "Could enterprise KB answer this?" as YES -> route to "enterprise" (RAG).

Return valid JSON only:
{{
  "category": "CURRENT_INFORMATION|INTERNAL_KNOWLEDGE|GENERAL_KNOWLEDGE|AMBIGUOUS",
  "route": "web|enterprise|casual|hybrid|tool|agent",
  "confidence": 0.95,
  "reason": "Step 1 & Step 2 evaluation summary",
  "requires_rag": true,
  "requires_web": false,
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

            if decision.category == QueryCategory.CURRENT_INFORMATION or decision.route == QueryRoute.WEB:
                enterprise_terms = {
                    "company", "enterprise", "internal", "employee", "policy", "policies",
                    "procedure", "finance", "hr", "payroll", "leave", "department",
                    "invoice", "budget", "compliance", "audit", "document", "handbook",
                    "guideline", "approval", "benefit", "reimbursement", "travel",
                    "organization", "portal", "salary", "onboarding", "our",
                }
                words = set(re.findall(r"[a-z0-9']+", query.lower()))
                if bool(words & enterprise_terms):
                    decision.route = QueryRoute.HYBRID
                    decision.requires_web = True
                    decision.requires_rag = True
                else:
                    decision.requires_web = True
                    decision.requires_rag = False
            elif decision.category == QueryCategory.INTERNAL_KNOWLEDGE or decision.route == QueryRoute.ENTERPRISE:
                decision.requires_rag = True
                decision.requires_web = False
            elif decision.category == QueryCategory.GENERAL_KNOWLEDGE or decision.route == QueryRoute.CASUAL:
                decision.requires_rag = False
                decision.requires_web = False
            elif decision.category == QueryCategory.AMBIGUOUS:
                decision.route = QueryRoute.ENTERPRISE
                decision.requires_rag = True
                decision.requires_web = False

            return decision

        except Exception as exc:
            logger.warning("LLM query routing failed: %s", str(exc))
            return QueryRoutingDecision(
                category=QueryCategory.AMBIGUOUS,
                route=QueryRoute.ENTERPRISE,
                confidence=0.51,
                reason="Router fallback: Could enterprise KB answer this? -> YES -> RAG.",
                requires_rag=True,
                requires_web=False,
            )


query_router = QueryRouter()

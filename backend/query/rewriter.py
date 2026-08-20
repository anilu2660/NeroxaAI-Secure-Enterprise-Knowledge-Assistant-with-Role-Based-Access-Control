import json
import logging
import re

from backend.llm.service import llm_service

logger = logging.getLogger(__name__)


class QueryRewriter:
    _COREFERENCE_PATTERNS = re.compile(
        r"\b(it|its|they|them|their|this|that|these|those|he|him|his|she|her|same|above|previous|also|too|what about|how about|and for|explain more)\b",
        re.IGNORECASE,
    )

    def __init__(self):
        self.llm = llm_service

    def has_coreference(self, query: str) -> bool:
        """Check if query contains pronouns or ellipsis requiring conversation context."""
        words = query.strip().split()
        if len(words) <= 3:
            return True
        return bool(self._COREFERENCE_PATTERNS.search(query))

    async def rewrite(self, query: str, conversation_history: str = "") -> str:
        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        clean_q = query.strip()
        if not conversation_history.strip() or not self.has_coreference(clean_q):
            return clean_q

        prompt = f"""
You are a conversational query rewriter for an enterprise RAG system.

Given the conversation history and the latest user message, rewrite the latest message into a standalone search query.

Rules:
1. Resolve pronouns such as "it", "they", "that", "this", "their", etc.
2. Resolve references such as "during that period", "above", "previously mentioned".
3. Preserve the user's original intent.
4. Do not answer the question.
5. Do not add information that is not supported by the conversation.
6. Return only the standalone query.

Return JSON only:
{{"rewritten_query": "standalone search query here"}}

Conversation history:
{conversation_history}

Latest user message:
{query}
""".strip()

        try:
            response = await self.llm.generate_text(
                prompt=prompt,
                temperature=0.0,
                max_tokens=150,
            )
            text = response if isinstance(response, str) else str(response)
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                rewritten = str(data.get("rewritten_query", "")).strip()
                if rewritten:
                    return rewritten[:2000]

            # Direct fallback if raw text was returned instead of JSON
            clean_text = text.strip().strip('"').strip("'")
            if clean_text and len(clean_text) < 300 and "\n" not in clean_text:
                return clean_text

            return query.strip()
        except Exception as exc:
            logger.warning("Query rewriting failed; using original query: %s", str(exc))
            return query.strip()


query_rewriter = QueryRewriter()

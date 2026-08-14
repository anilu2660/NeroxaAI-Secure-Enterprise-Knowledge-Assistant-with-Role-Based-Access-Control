import json
import logging
import re

from backend.llm.service import llm_service

logger = logging.getLogger(__name__)


class QueryRewriter:
    async def rewrite(self, query: str, conversation_history: str = "") -> str:
        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        if not conversation_history.strip():
            return query.strip()

        prompt = f"""
Rewrite the user's latest question into a standalone enterprise knowledge-base search query.
Preserve the user's intent and important entities. Resolve pronouns and references using the conversation.
Do not answer the question. Do not add facts that are not present in the conversation.
Return JSON only:
{{"rewritten_query":"..."}}

Conversation history:
{conversation_history}

Latest user question:
{query}
""".strip()

        try:
            response = await self.llm.generate_text(
                prompt=prompt,
                temperature=0.0,
                max_tokens=120,
            )
            text = response if isinstance(response, str) else str(response)
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if not match:
                raise ValueError("Query rewriter returned no JSON object.")

            data = json.loads(match.group(0))
            rewritten = str(data.get("rewritten_query", "")).strip()
            if not rewritten:
                raise ValueError("Query rewriter returned an empty query.")
            return rewritten[:2000]
        except Exception as exc:
            logger.warning("Query rewriting failed; using original query: %s", str(exc))
            return query.strip()


query_rewriter = QueryRewriter()

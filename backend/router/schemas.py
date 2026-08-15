from enum import Enum

from pydantic import BaseModel, Field


class QueryCategory(str, Enum):
    INTERNAL_KNOWLEDGE = "INTERNAL_KNOWLEDGE"
    CURRENT_INFORMATION = "CURRENT_INFORMATION"
    GENERAL_KNOWLEDGE = "GENERAL_KNOWLEDGE"
    AMBIGUOUS = "AMBIGUOUS"


class QueryRoute(str, Enum):
    CASUAL = "casual"
    ENTERPRISE = "enterprise"
    WEB = "web"
    HYBRID = "hybrid"
    TOOL = "tool"
    AGENT = "agent"


class QueryRoutingDecision(BaseModel):
    category: QueryCategory = QueryCategory.INTERNAL_KNOWLEDGE
    route: QueryRoute
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str | None = None
    rewritten_query: str | None = None
    requires_rag: bool = False
    requires_web: bool = False
    requires_tool: bool = False
    tool_name: str | None = None
    requires_agent: bool = False

from enum import Enum

from pydantic import BaseModel, Field


class QueryRoute(str, Enum):
    CASUAL = "casual"
    ENTERPRISE = "enterprise"
    WEB = "web"
    HYBRID = "hybrid"
    TOOL = "tool"


class QueryRoutingDecision(BaseModel):
    route: QueryRoute
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str | None = None
    rewritten_query: str | None = None
    requires_rag: bool = False
    requires_web: bool = False
    requires_tool: bool = False
    tool_name: str | None = None

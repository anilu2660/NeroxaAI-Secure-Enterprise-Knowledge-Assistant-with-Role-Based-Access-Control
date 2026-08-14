from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AgentStepType(str, Enum):
    RAG = "rag"
    WEB = "web"
    TOOL = "tool"


class AgentStep(BaseModel):
    id: int = Field(ge=1)
    type: AgentStepType
    task: str = Field(min_length=1, max_length=1000)
    tool_name: str | None = None


class AgentPlan(BaseModel):
    steps: list[AgentStep] = Field(min_length=1, max_length=4)


class AgentStepResult(BaseModel):
    step_id: int
    type: AgentStepType
    status: str
    result: Any = None


class AgentExecutionResult(BaseModel):
    answer: str
    plan: AgentPlan
    steps: list[AgentStepResult]

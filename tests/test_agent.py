import pytest

from backend.agent.schemas import AgentPlan, AgentStep, AgentStepType
from backend.agent.service import AgentService


def test_agent_rejects_unregistered_tool():
    service = AgentService()
    plan = AgentPlan(
        steps=[
            AgentStep(
                id=1,
                type=AgentStepType.TOOL,
                task="run an arbitrary command",
                tool_name="shell",
            )
        ]
    )

    with pytest.raises(ValueError, match="unregistered tool"):
        service._validate_plan(plan)


def test_agent_rejects_non_sequential_steps():
    service = AgentService()
    plan = AgentPlan(
        steps=[
            AgentStep(id=1, type=AgentStepType.RAG, task="find policy"),
            AgentStep(id=3, type=AgentStepType.WEB, task="find latest information"),
        ]
    )

    with pytest.raises(ValueError, match="sequential"):
        service._validate_plan(plan)


def test_agent_rejects_too_many_steps():
    service = AgentService()
    plan = AgentPlan(
        steps=[
            AgentStep(id=1, type=AgentStepType.RAG, task="one"),
            AgentStep(id=2, type=AgentStepType.RAG, task="two"),
            AgentStep(id=3, type=AgentStepType.RAG, task="three"),
            AgentStep(id=4, type=AgentStepType.RAG, task="four"),
        ]
    )
    service._validate_plan(plan)

    plan.steps.append(
        AgentStep(id=5, type=AgentStepType.RAG, task="five")
    )

    with pytest.raises(ValueError, match="maximum"):
        service._validate_plan(plan)

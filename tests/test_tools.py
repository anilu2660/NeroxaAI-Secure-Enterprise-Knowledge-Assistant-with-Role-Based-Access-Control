import pytest

from backend.tools.builtin.calculator import CalculatorTool
from backend.tools.executor import ToolAuthorizationError, ToolExecutor
from backend.tools.registry import ToolRegistry


@pytest.mark.asyncio
async def test_calculator_basic_expression():
    result = await CalculatorTool().execute({"expression": "25 * 4 + 10"})
    assert result["result"] == 110


@pytest.mark.asyncio
async def test_calculator_rejects_function_calls():
    with pytest.raises(ValueError):
        await CalculatorTool().execute({"expression": "__import__('os').system('whoami')"})


@pytest.mark.asyncio
async def test_calculator_rejects_unknown_syntax():
    with pytest.raises(ValueError):
        await CalculatorTool().execute({"expression": "2 // 2"})


@pytest.mark.asyncio
async def test_tool_registry_rejects_duplicate_names():
    registry = ToolRegistry()
    tool = CalculatorTool()
    registry.register(tool)
    with pytest.raises(ValueError):
        registry.register(tool)


@pytest.mark.asyncio
async def test_executor_enforces_role_authorization():
    tool = CalculatorTool()
    tool.allowed_roles = {"admin"}
    registry = ToolRegistry()
    registry.register(tool)

    executor = ToolExecutor()
    from backend.tools import executor as executor_module
    original = executor_module.registry
    executor_module.registry = registry
    try:
        with pytest.raises(ToolAuthorizationError):
            await executor.execute("calculator", {"expression": "2+2"}, "employee")
    finally:
        executor_module.registry = original

from backend.tools.builtin.calculator import CalculatorTool
from backend.tools.registry import registry


def register_builtin_tools() -> None:
    if registry.get("calculator") is None:
        registry.register(CalculatorTool())


register_builtin_tools()

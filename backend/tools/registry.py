import logging

from backend.tools.base import BaseTool, ToolDefinition

logger = logging.getLogger(__name__)


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered.")
        self._tools[tool.name] = tool

    def get(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def names(self) -> set[str]:
        return set(self._tools.keys())

    def definitions(self) -> list[ToolDefinition]:
        return [tool.definition() for tool in self._tools.values()]


registry = ToolRegistry()

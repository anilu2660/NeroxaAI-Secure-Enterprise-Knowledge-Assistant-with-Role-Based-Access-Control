import logging
from typing import Any

from backend.tools.registry import registry

logger = logging.getLogger(__name__)


class ToolAuthorizationError(PermissionError):
    pass


class ToolExecutor:
    async def execute(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        user_role: str,
    ) -> Any:
        tool = registry.get(tool_name)
        if not tool:
            raise ValueError(f"Unknown tool '{tool_name}'.")

        if tool.allowed_roles and user_role not in tool.allowed_roles:
            logger.warning(
                "Tool authorization denied | tool=%s | role=%s",
                tool_name,
                user_role,
            )
            raise ToolAuthorizationError("User is not authorized to execute this tool.")

        return await tool.execute(arguments)


executor = ToolExecutor()

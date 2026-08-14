from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel


class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: dict[str, Any]
    allowed_roles: set[str] = set()


class BaseTool(ABC):
    name: str
    description: str
    allowed_roles: set[str] = set()

    @property
    @abstractmethod
    def input_schema(self) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def execute(self, arguments: dict[str, Any]) -> Any:
        raise NotImplementedError

    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            input_schema=self.input_schema,
            allowed_roles=self.allowed_roles,
        )

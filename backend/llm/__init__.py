"""
LLM Module

Manages interaction with the Ollama local LLM for response generation.
Provides prompt construction and communication services.
"""

from backend.llm.service import LLMService, llm_service
from backend.llm.prompts import SYSTEM_PROMPT, build_query_prompt, build_context_prompt

__all__ = [
    "LLMService",
    "llm_service",
    "SYSTEM_PROMPT",
    "build_query_prompt",
    "build_context_prompt",
]

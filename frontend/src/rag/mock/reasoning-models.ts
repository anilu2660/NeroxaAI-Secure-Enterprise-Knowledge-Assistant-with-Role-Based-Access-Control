import type { ReasoningModelOption } from "@/api/types";

/**
 * Reasoning provider catalog — product configuration for FUTURE integrations.
 *
 * Nothing in this list is connected in the current codebase: there is no
 * Ollama process, no cloud provider key, and no server-side inference call.
 * Every entry is therefore `available: false` and the UI must render it as
 * "Not configured". Flip `available` to true only when the corresponding
 * provider is genuinely wired through the service layer.
 */
export const reasoningModels: ReasoningModelOption[] = [
  {
    id: "qwen2.5-local",
    name: "Qwen 2.5",
    shortLabel: "Qwen 2.5 · Local",
    tier: "local",
    provider: "Ollama",
    detail: "Connected to local Ollama runtime (Qwen 2.5)",
    available: true,
  },
  {
    id: "gpt-cloud",
    name: "GPT",
    shortLabel: "GPT · Cloud",
    tier: "cloud",
    provider: "OpenAI",
    detail: "Cloud provider not connected",
    available: false,
  },
  {
    id: "gemini-cloud",
    name: "Gemini",
    shortLabel: "Gemini · Cloud",
    tier: "cloud",
    provider: "Google",
    detail: "Cloud provider not connected",
    available: false,
  },
];

export const defaultReasoningModelId: string | null = "qwen2.5-local";

export const noModelConfiguredLabel = "No model configured";

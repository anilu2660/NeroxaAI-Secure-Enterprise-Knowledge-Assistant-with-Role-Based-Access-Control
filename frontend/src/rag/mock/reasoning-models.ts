import type { ReasoningModelOption } from "@/api/types";

/**
 * Reasoning provider catalog.
 * The actual model is selected server-side through OLLAMA_MODEL on Railway.
 * The frontend never receives or stores the Ollama API key.
 */
export const reasoningModels: ReasoningModelOption[] = [
  {
    id: "qwen2.5:3b",
    name: "Qwen 2.5:3B",
    shortLabel: "qwen2.5:3b",
    tier: "local",
    provider: "Ollama",
    detail: "Fast local Ollama inference model (qwen2.5:3b)",
    available: true,
  },
  {
    id: "gpt-cloud",
    name: "GPT-4o",
    shortLabel: "GPT-4o · Cloud",
    tier: "cloud",
    provider: "OpenAI",
    detail: "Cloud provider not connected",
    available: false,
  },
  {
    id: "gemini-cloud",
    name: "Gemini 1.5 Pro",
    shortLabel: "Gemini · Cloud",
    tier: "cloud",
    provider: "Google",
    detail: "Cloud provider not connected",
    available: false,
  },
];

export const defaultReasoningModelId: string | null = "qwen2.5:3b";

export const noModelConfiguredLabel = "No model configured";

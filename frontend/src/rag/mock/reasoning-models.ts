import type { ReasoningModelOption } from "@/api/types";

/**
 * Reasoning provider catalog.
 * The actual model is selected server-side through OLLAMA_MODEL on Railway.
 * The frontend never receives or stores the Ollama API key.
 */
export const reasoningModels: ReasoningModelOption[] = [
  {
    id: "ollama-cloud",
    name: "Ollama Cloud",
    shortLabel: "Ollama · Cloud",
    tier: "cloud",
    provider: "Ollama",
    detail: "Connected through the deployed FastAPI backend",
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

export const defaultReasoningModelId: string | null = "ollama-cloud";

export const noModelConfiguredLabel = "No model configured";

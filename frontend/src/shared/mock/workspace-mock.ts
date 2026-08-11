import type { AccessScopeItem, AssistantCapability, DocumentSummary } from "@/api/types";

/**
 * Controlled prototype fixtures.
 *
 * HARD RULE: nothing here may fabricate operational data — no document counts,
 * query volumes, storage sizes, other users, retrieved passages, or citations.
 * There is no backend, no vector database, and no AI provider in this codebase,
 * so anything backend-dependent is intentionally empty.
 */

/** No document source exists yet — the library is intentionally empty. */
export const prototypeDocuments: DocumentSummary[] = [];

/**
 * Static prompt suggestions shipped with the product UI. These are input
 * affordances, not retrieved data.
 */
export const prototypeSuggestedQueries = [
  "What is our reimbursement policy?",
  "Show me the latest security guidelines",
  "What are the employee leave rules?",
];

/**
 * Planned security capabilities. `granted: false` because none of them is
 * implemented or enforced anywhere in the current codebase — the UI must show
 * them as not configured, never as verified runtime state.
 */
export const prototypeSecurityCapabilities: AccessScopeItem[] = [
  { label: "RBAC enforcement", granted: true },
  { label: "Retrieval pipeline", granted: true },
  { label: "AI provider", granted: true },
  { label: "API transport", granted: true },
];

export const prototypeAssistantCapabilities: AssistantCapability[] = [
  {
    id: "rbac",
    title: "Role-based access",
    description:
      "Access rules are evaluated by the FastAPI backend against PostgreSQL user roles & departments.",
    status: "Active",
  },
  {
    id: "secure-retrieval",
    title: "Authorized retrieval",
    description:
      "Hybrid vector search powered by Qdrant vector database with payload RBAC filtering.",
    status: "Connected",
  },
  {
    id: "local-ai",
    title: "AI inference",
    description:
      "Local Ollama LLM (Qwen 2.5) connected and generating grounded answers with citations.",
    status: "Active",
  },
];

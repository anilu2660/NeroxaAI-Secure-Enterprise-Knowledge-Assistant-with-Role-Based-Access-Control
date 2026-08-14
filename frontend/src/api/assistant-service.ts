import type {
  AgentExecutionStep,
  AgentPlan,
  AssistantQueryRequest,
  AssistantQueryResponse,
  AssistantSource,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface AssistantQueryOptions {
  token?: string | null;
  signal?: AbortSignal;
}

function buildHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeSource(source: Record<string, unknown>): AssistantSource {
  return {
    id: String(source.id ?? source.document_id ?? source.url ?? crypto.randomUUID()),
    type: source.type === "web" ? "web" : "enterprise",
    title: String(source.title ?? source.document_title ?? source.filename ?? "Source"),
    url: typeof source.url === "string" ? source.url : null,
    documentId: typeof source.document_id === "string" ? source.document_id : null,
    page: typeof source.page === "number" ? source.page : null,
    department: typeof source.department === "string" ? source.department : null,
    snippet: typeof source.snippet === "string" ? source.snippet : null,
  };
}

function normalizeAgentPlan(value: unknown): AgentPlan | null {
  if (!value || typeof value !== "object") return null;
  const plan = value as { steps?: unknown };
  if (!Array.isArray(plan.steps)) return null;

  const steps = plan.steps
    .filter((step): step is Record<string, unknown> => !!step && typeof step === "object")
    .map((step) => ({
      id: Number(step.id),
      type: String(step.type) as AgentExecutionStep["type"],
      task: String(step.task ?? ""),
      toolName: typeof step.tool_name === "string" ? step.tool_name : null,
      status: null,
    }));

  return { steps };
}

function normalizeResponse(
  request: AssistantQueryRequest,
  payload: Record<string, unknown>,
): AssistantQueryResponse {
  const rawSources = Array.isArray(payload.sources) ? payload.sources : [];
  const rawSteps = Array.isArray(payload.steps) ? payload.steps : [];

  const route = String(payload.route ?? "enterprise") as AssistantQueryResponse["route"];
  const normalizedRoute = ["casual", "enterprise", "web", "hybrid", "tool", "agent"].includes(route)
    ? route
    : "enterprise";

  const agentPlan = normalizeAgentPlan(payload.plan);
  const steps: AgentExecutionStep[] = rawSteps
    .filter((step): step is Record<string, unknown> => !!step && typeof step === "object")
    .map((step) => ({
      id: Number(step.step_id ?? step.id),
      type: String(step.type ?? "rag") as AgentExecutionStep["type"],
      task: "",
      toolName: typeof step.tool_name === "string" ? step.tool_name : null,
      status: step.status === "failed" ? "failed" : "success",
    }));

  return {
    query: String(payload.query ?? request.query),
    answer: String(payload.answer ?? ""),
    route: normalizedRoute,
    routeConfidence:
      typeof payload.route_confidence === "number" ? payload.route_confidence : null,
    rewrittenQuery:
      typeof payload.rewritten_query === "string" ? payload.rewritten_query : null,
    cached: payload.cached === true,
    model: typeof payload.model === "string" ? payload.model : null,
    chunksRetrieved:
      typeof payload.chunks_retrieved === "number" ? payload.chunks_retrieved : 0,
    sources: rawSources
      .filter((source): source is Record<string, unknown> => !!source && typeof source === "object")
      .map(normalizeSource),
    toolName: typeof payload.tool_name === "string" ? payload.tool_name : null,
    toolStatus:
      payload.tool_status === "success" || payload.tool_status === "not_executed"
        ? payload.tool_status
        : null,
    toolResult: payload.tool_result ?? null,
    agentPlan,
    agentSteps: steps,
  };
}

export async function queryAssistant(
  request: AssistantQueryRequest,
  options: AssistantQueryOptions = {},
): Promise<AssistantQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/query`, {
    method: "POST",
    headers: buildHeaders(options.token),
    body: JSON.stringify(request),
    signal: options.signal,
  });

  if (!response.ok) {
    let detail = `Assistant request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Keep the status-based error when the server does not return JSON.
    }
    throw new Error(detail);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return normalizeResponse(request, payload);
}

export function createAssistantAbortController(): AbortController {
  return new AbortController();
}

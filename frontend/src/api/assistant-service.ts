import type {
  AgentExecutionStep,
  AgentPlan,
  AssistantQueryRequest,
  AssistantQueryResponse,
  AssistantSource,
} from "./assistant-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface AssistantQueryOptions {
  token?: string | null;
  signal?: AbortSignal;
}

export interface AssistantSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface AssistantExecutionMetadata {
  route?: string | null;
  route_confidence?: number | null;
  rewritten_query?: string | null;
  cached?: boolean;
  model?: string | null;
  chunks_retrieved?: number;
  tool_name?: string | null;
  tool_status?: string | null;
  tool_result?: unknown;
  agent_plan?: unknown;
  agent_steps?: unknown[];
  web_search_status?: string | null;
}

export interface AssistantMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  sources: Record<string, unknown>[] | null;
  execution_metadata?: AssistantExecutionMetadata | null;
  created_at: string;
}

function buildHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(response: Response, fallback: string): Promise<never> {
  let detail = fallback;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) detail = body.detail;
  } catch {
    // Keep the status-based fallback when the server does not return JSON.
  }
  throw new Error(detail);
}

function normalizeSource(source: Record<string, unknown>, index: number): AssistantSource {
  return {
    id: String(source.id ?? source.document_id ?? source.url ?? `source-${index}`),
    type: source.type === "web" ? "web" : "enterprise",
    title: String(source.title ?? source.document_title ?? source.filename ?? "Source"),
    url: typeof source.url === "string" ? source.url : null,
    documentId: typeof source.document_id === "string" ? source.document_id : null,
    page: typeof source.page === "number"
      ? source.page
      : typeof source.page_number === "number"
        ? source.page_number
        : null,
    department: typeof source.department === "string" ? source.department : null,
    snippet: typeof source.snippet === "string" ? source.snippet : null,
  };
}

function normalizeAgentPlan(value: unknown): AgentPlan | null {
  if (!value || typeof value !== "object") return null;
  const plan = value as { steps?: unknown };
  if (!Array.isArray(plan.steps)) return null;

  return {
    steps: plan.steps
      .filter((step): step is Record<string, unknown> => !!step && typeof step === "object")
      .map((step) => ({
        id: Number(step.id ?? step.step_id),
        type: String(step.type ?? "rag") as AgentExecutionStep["type"],
        task: String(step.task ?? ""),
        toolName: typeof step.tool_name === "string" ? step.tool_name : null,
        status: step.status === "failed" ? "failed" : null,
      })),
  };
}

function normalizeResponse(
  request: AssistantQueryRequest,
  payload: Record<string, unknown>,
): AssistantQueryResponse {
  const rawSources = Array.isArray(payload.sources) ? payload.sources : [];
  const metadata =
    payload.execution_metadata && typeof payload.execution_metadata === "object"
      ? (payload.execution_metadata as AssistantExecutionMetadata)
      : null;

  const routeValue = metadata?.route ?? payload.route ?? "enterprise";
  const route = String(routeValue);
  const normalizedRoute = ["casual", "enterprise", "web", "hybrid", "tool", "agent"].includes(route)
    ? (route as AssistantQueryResponse["route"])
    : "enterprise";

  const rawSteps = metadata?.agent_steps ?? payload.steps ?? [];
  const steps: AgentExecutionStep[] = Array.isArray(rawSteps)
    ? rawSteps
        .filter((step): step is Record<string, unknown> => !!step && typeof step === "object")
        .map((step) => ({
          id: Number(step.step_id ?? step.id),
          type: String(step.type ?? "rag") as AgentExecutionStep["type"],
          task: String(step.task ?? ""),
          toolName: typeof step.tool_name === "string" ? step.tool_name : null,
          status: step.status === "failed" ? "failed" : "success",
        }))
    : [];

  const plan = metadata?.agent_plan ?? payload.plan;

  return {
    query: String(payload.query ?? request.query),
    answer: String(payload.answer ?? ""),
    route: normalizedRoute,
    routeConfidence:
      typeof (metadata?.route_confidence ?? payload.route_confidence) === "number"
        ? (metadata?.route_confidence ?? payload.route_confidence) as number
        : null,
    rewrittenQuery:
      typeof (metadata?.rewritten_query ?? payload.rewritten_query) === "string"
        ? (metadata?.rewritten_query ?? payload.rewritten_query) as string
        : null,
    cached: metadata?.cached === true || payload.cached === true,
    model:
      typeof (metadata?.model ?? payload.model) === "string"
        ? (metadata?.model ?? payload.model) as string
        : null,
    chunksRetrieved:
      typeof (metadata?.chunks_retrieved ?? payload.chunks_retrieved) === "number"
        ? (metadata?.chunks_retrieved ?? payload.chunks_retrieved) as number
        : 0,
    sources: rawSources
      .filter((source): source is Record<string, unknown> => !!source && typeof source === "object")
      .map(normalizeSource),
    toolName:
      typeof (metadata?.tool_name ?? payload.tool_name) === "string"
        ? (metadata?.tool_name ?? payload.tool_name) as string
        : null,
    toolStatus:
      (metadata?.tool_status ?? payload.tool_status) === "success" ||
      (metadata?.tool_status ?? payload.tool_status) === "not_executed"
        ? (metadata?.tool_status ?? payload.tool_status) as "success" | "not_executed"
        : null,
    toolResult: metadata?.tool_result ?? payload.tool_result ?? null,
    agentPlan: normalizeAgentPlan(plan),
    agentSteps: steps,
    messageId: typeof payload.message_id === "string" ? payload.message_id : null,
    createdAt: typeof payload.created_at === "string" ? payload.created_at : null,
  };
}

export async function createAssistantSession(
  title = "New Conversation",
  options: AssistantQueryOptions = {},
): Promise<AssistantSession> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
    method: "POST",
    headers: buildHeaders(options.token),
    body: JSON.stringify({ title }),
    signal: options.signal,
  });

  if (!response.ok) {
    return parseError(response, `Could not create chat session (${response.status}).`);
  }

  return (await response.json()) as AssistantSession;
}

export async function sendAssistantMessage(
  sessionId: string,
  message: string,
  departmentFilter?: string | null,
  options: AssistantQueryOptions = {},
): Promise<AssistantMessage> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
    method: "POST",
    headers: buildHeaders(options.token),
    body: JSON.stringify({
      session_id: sessionId,
      message,
      department_filter: departmentFilter ?? null,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    return parseError(response, `Assistant request failed (${response.status}).`);
  }

  return (await response.json()) as AssistantMessage;
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
    return parseError(response, `Assistant request failed (${response.status}).`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return normalizeResponse(request, payload);
}

export function normalizeAssistantMessage(
  request: AssistantQueryRequest,
  message: AssistantMessage,
): AssistantQueryResponse {
  return normalizeResponse(request, {
    query: request.query,
    answer: message.content,
    sources: message.sources ?? [],
    execution_metadata: message.execution_metadata ?? null,
    message_id: message.id,
    created_at: message.created_at,
  });
}

export function createAssistantAbortController(): AbortController {
  return new AbortController();
}

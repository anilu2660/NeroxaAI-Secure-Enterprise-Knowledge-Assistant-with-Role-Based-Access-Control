export type AssistantRoute = "casual" | "enterprise" | "web" | "hybrid" | "tool" | "agent";

export type AgentStepType = "rag" | "web" | "tool";
export type AgentStepStatus = "success" | "failed" | null;

export interface AssistantQueryRequest {
  query: string;
  conversation_history?: string;
  department_filter?: string | null;
  top_k?: number;
  temperature?: number;
}

export interface AssistantSource {
  id: string;
  type: "enterprise" | "web";
  title: string;
  url: string | null;
  documentId: string | null;
  page: number | null;
  department: string | null;
  snippet: string | null;
}

export interface AgentExecutionStep {
  id: number;
  type: AgentStepType;
  task: string;
  toolName: string | null;
  status: AgentStepStatus;
}

export interface AgentPlan {
  steps: AgentExecutionStep[];
}

export interface AssistantQueryResponse {
  query: string;
  answer: string;
  route: AssistantRoute;
  routeConfidence: number | null;
  rewrittenQuery: string | null;
  cached: boolean;
  model: string | null;
  chunksRetrieved: number;
  sources: AssistantSource[];
  toolName: string | null;
  toolStatus: "success" | "not_executed" | null;
  toolResult: unknown;
  agentPlan: AgentPlan | null;
  agentSteps: AgentExecutionStep[];
}

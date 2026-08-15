import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { AssistantComposer, type ComposerSubmission } from "@/rag/components/AssistantComposer";
import { AssistantConversation } from "@/rag/components/AssistantConversation";
import { AssistantContextPanel } from "@/rag/components/AssistantContextPanel";
import { ReasoningModelSelector } from "@/rag/components/ReasoningModelSelector";
import { defaultReasoningModelId } from "@/rag/mock/reasoning-models";
import { useUserProfile } from "@/auth/use-user-profile";
import { useAuth } from "@/auth/auth-context";
import type { AssistantAnswer, AssistantTurn, Citation } from "@/api/types";
import type { AssistantQueryResponse } from "@/api/assistant-types";
import {
  askAssistant,
  createDbChatSession,
  deleteDbChatSession,
  fetchUserChatSessions,
  sendDbChatMessage,
  getAccessProfile,
  getAssistantCapabilities,
  getAssistantTools,
  getReasoningModels,
  getSuggestedQueries,
  type DbChatSession,
} from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/assistant")({
  validateSearch: z.object({ result: z.string().optional(), q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Assistant — NeroxaAI" },
      {
        name: "description",
        content:
          "AI Knowledge Assistant — ask questions about your organization's knowledge base with role-based access control.",
      },
      { property: "og:title", content: "AI Assistant — NeroxaAI" },
      {
        property: "og:description",
        content: "Ask questions about your organization's knowledge base with role-based access.",
      },
    ],
  }),
  component: AssistantPage,
});

function getSessionStorageKey(userId?: string | null): string {
  return `neroxa.assistant.turns.${userId || "anonymous"}`;
}

function loadPersistedTurns(userId?: string | null): AssistantTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(getSessionStorageKey(userId));
    return raw ? (JSON.parse(raw) as AssistantTurn[]) : [];
  } catch {
    return [];
  }
}

function persistTurns(turns: AssistantTurn[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      getSessionStorageKey(userId),
      JSON.stringify(turns.filter((turn) => turn.answer !== null)),
    );
  } catch {
    return;
  }
}

function normalizeExecution(value: unknown): AssistantQueryResponse | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const query = data["query"];
  const answer = data["answer"];
  const route = data["route"];
  const routeConfidence = data["route_confidence"];
  const rewrittenQuery = data["rewritten_query"];
  const cached = data["cached"];
  const model = data["model"];
  const chunksRetrieved = data["chunks_retrieved"];
  const sources = data["sources"];
  const toolName = data["tool_name"];
  const toolStatus = data["tool_status"];
  const toolResult = data["tool_result"];
  const agentPlan = data["agent_plan"];
  const agentSteps = data["agent_steps"];
  const messageId = data["message_id"];
  const createdAt = data["created_at"];
  const webSearchStatus = data["web_search_status"];

  return {
    query: String(query ?? ""),
    answer: String(answer ?? ""),
    route: (route as AssistantQueryResponse["route"]) ?? "casual",
    routeConfidence: typeof routeConfidence === "number" ? routeConfidence : null,
    rewrittenQuery: typeof rewrittenQuery === "string" ? rewrittenQuery : null,
    cached: Boolean(cached),
    model: typeof model === "string" ? model : null,
    chunksRetrieved: typeof chunksRetrieved === "number" ? chunksRetrieved : 0,
    sources: Array.isArray(sources)
      ? sources.map((src: any, index: number) => ({
          id: String(src["id"] ?? `src_${index}`),
          type: src["type"] === "web" ? "web" : "enterprise",
          title: String(src["title"] ?? src["document_title"] ?? "Source"),
          url: typeof src["url"] === "string" ? src["url"] : null,
          documentId: typeof src["document_id"] === "string" ? src["document_id"] : null,
          page:
            typeof src["page"] === "number"
              ? src["page"]
              : typeof src["page_number"] === "number"
                ? src["page_number"]
                : null,
          department: typeof src["department"] === "string" ? src["department"] : null,
          snippet: typeof src["snippet"] === "string" ? src["snippet"] : null,
        }))
      : [],
    toolName: typeof toolName === "string" ? toolName : null,
    toolStatus:
      toolStatus === "success" || toolStatus === "not_executed"
        ? toolStatus
        : null,
    toolResult: toolResult ?? null,
    agentPlan:
      agentPlan && typeof agentPlan === "object"
        ? (agentPlan as AssistantQueryResponse["agentPlan"])
        : null,
    agentSteps: Array.isArray(agentSteps)
      ? (agentSteps as AssistantQueryResponse["agentSteps"])
      : [],
    messageId: typeof messageId === "string" ? messageId : null,
    createdAt: typeof createdAt === "string" ? createdAt : null,
    webSearchStatus:
      typeof webSearchStatus === "string" ? webSearchStatus : null,
  };
}

function executionToCitations(execution: AssistantQueryResponse | null): Citation[] {
  return (execution?.sources ?? []).map((src: any, index) => ({
    id: src.id || src.citation_id || `cit_${index}`,
    documentId: src.documentId || src.document_id || `doc_${index}`,
    documentTitle: src.documentTitle || src.title || src.document_title || "Document",
    ...(src.snippet ? { snippet: src.snippet } : {}),
    ...(src.department ? { department: src.department } : {}),
    ...(src.url ? { url: src.url } : {}),
    ...(src.type ? { type: src.type } : {}),
    ...(src.page != null ? { page: src.page } : src.page_number != null ? { page: src.page_number } : {}),
  }));
}

function dbSessionToTurns(dbSession: DbChatSession): AssistantTurn[] {
  const turns: AssistantTurn[] = [];
  const msgs = dbSession.messages || [];

  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    if (!msg || msg.role !== "user") continue;

    const nextMsg = msgs[i + 1];
    const assistantMsg = nextMsg?.role === "assistant" ? nextMsg : null;
    if (assistantMsg) i++;

    let execution = normalizeExecution(
      assistantMsg ? (assistantMsg as typeof assistantMsg & { execution_metadata?: unknown }).execution_metadata : null,
    );
    const rawSources = (assistantMsg?.sources as any[]) || [];
    if (execution && (!execution.sources || execution.sources.length === 0) && rawSources.length > 0) {
      execution = {
        ...execution,
        sources: normalizeExecution({ sources: rawSources })?.sources ?? [],
      };
    }
    const citations: Citation[] = execution
      ? executionToCitations(execution)
      : rawSources.map((src: any, idx: number) => ({
          id: `cit_${idx}`,
          documentId: src.document_id || src.id || `doc_${idx}`,
          documentTitle: src.document_title || src.title || "Document",
          department: src.department,
          ...(src.page_number && !isNaN(Number(src.page_number)) ? { page: Number(src.page_number) } : {}),
        }));

    const isAccessDenied = assistantMsg?.content.toLowerCase().startsWith("access denied");

    const answerObj: AssistantAnswer | null = assistantMsg
      ? {
          id: assistantMsg.id,
          query: msg.content,
          answer: assistantMsg.content,
          status: "live",
          keyReferences: citations.map((citation) => citation.snippet).filter(Boolean).slice(0, 3) as string[],
          citations,
          grounded: citations.length > 0,
          retrievalStatus: isAccessDenied
            ? "Access Restricted (RBAC)"
            : citations.length > 0
              ? "Retrieved securely (RBAC filtered)"
              : "Direct LLM Response",
          createdAt: assistantMsg.created_at,
          modelId: execution?.model ?? "qwen2.5-local",
          modelLabel: execution?.model ? `Ollama (${execution.model})` : "Ollama (Qwen 2.5 Local)",
          execution,
        }
      : null;

    turns.push({ id: msg.id, question: msg.content, askedAt: msg.created_at, answer: answerObj });
  }

  return turns;
}

function AssistantPage() {
  const { session, can } = useAuth();
  const { profile } = useUserProfile();
  const user = session?.user ?? null;
  const actor = user?.name ?? "";
  const canQuery = can("assistant:query");

  const [turns, setTurns] = useState<AssistantTurn[]>(() => loadPersistedTurns(user?.id));
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [modelId, setModelId] = useState<string | null>(defaultReasoningModelId);

  useEffect(() => {
    let cancelled = false;

    async function initUserChat() {
      setTurns(loadPersistedTurns(user?.id));
      setDbSessionId(null);
      const token = typeof window !== "undefined" ? sessionStorage.getItem("neroxa.token") : null;
      if (!token || !user?.id) return;

      const dbSessions = await fetchUserChatSessions();
      if (!cancelled && dbSessions.length > 0 && dbSessions[0]) {
        const activeSession = dbSessions[0];
        setDbSessionId(activeSession.id);
        const loadedTurns = dbSessionToTurns(activeSession);
        if (loadedTurns.length > 0) {
          setTurns(loadedTurns);
          persistTurns(loadedTurns, user.id);
        }
      }
    }

    void initUserChat();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    persistTurns(turns, user?.id);
  }, [turns, user?.id]);

  const models = useQuery({ queryKey: ["reasoning-models"], queryFn: getReasoningModels });
  const capabilities = useQuery({ queryKey: ["assistant-capabilities"], queryFn: getAssistantCapabilities });
  const tools = useQuery({ queryKey: ["assistant-tools"], queryFn: getAssistantTools });
  const suggestions = useQuery({ queryKey: ["suggested-queries"], queryFn: getSuggestedQueries });
  const access = useQuery({
    queryKey: ["access-profile", user?.id ?? ""],
    queryFn: () => getAccessProfile(user),
    enabled: !!user,
  });

  const handleAsk = async (submission: ComposerSubmission) => {
    const { question, attachments, webSearch, toolIds } = submission;
    const turnId = `turn_${Date.now()}`;
    setTurns((current) => [...current, { id: turnId, question, askedAt: new Date().toISOString(), answer: null }]);
    setPending(true);

    try {
      let currentSessionId = dbSessionId;
      const token = typeof window !== "undefined" ? sessionStorage.getItem("neroxa.token") : null;
      if (token && !currentSessionId) {
        const created = await createDbChatSession(question.slice(0, 30) + (question.length > 30 ? "..." : ""));
        if (created) {
          currentSessionId = created.id;
          setDbSessionId(created.id);
        }
      }

      let answer: AssistantAnswer | null = null;
      if (token && currentSessionId) {
        const dbMsg = await sendDbChatMessage(currentSessionId, question);
        if (dbMsg) {
          const execution = normalizeExecution(
            (dbMsg as typeof dbMsg & { execution_metadata?: unknown }).execution_metadata,
          );
          const citations: Citation[] = execution
            ? executionToCitations(execution)
            : ((dbMsg.sources as any[]) || []).map((src: any, idx: number) => ({
                id: `cit_${idx}`,
                documentId: src.document_id || src.id || `doc_${idx}`,
                documentTitle: src.document_title || src.title || "Document",
                department: src.department,
                ...(src.page_number && !isNaN(Number(src.page_number)) ? { page: Number(src.page_number) } : {}),
              }));
          const isAccessDenied = dbMsg.content.toLowerCase().startsWith("access denied");
          answer = {
            id: dbMsg.id,
            query: question,
            answer: dbMsg.content,
            status: "live",
            keyReferences: citations.map((citation) => citation.snippet).filter(Boolean).slice(0, 3) as string[],
            citations,
            grounded: citations.length > 0,
            retrievalStatus: isAccessDenied
              ? "Access Restricted (RBAC)"
              : citations.length > 0
                ? "Retrieved securely (RBAC filtered)"
                : "Direct LLM Response",
            createdAt: dbMsg.created_at || new Date().toISOString(),
            modelId: execution?.model ?? "qwen2.5-local",
            modelLabel: execution?.model ? `Ollama (${execution.model})` : "Ollama (Qwen 2.5 Local)",
            execution,
          };
        }
      }

      if (!answer) {
        answer = await askAssistant({
          question,
          modelId,
          attachments,
          webSearch,
          toolIds,
          ...(actor ? { actor } : {}),
        });
      }

      setTurns((current) => current.map((turn) => (turn.id === turnId ? { ...turn, answer } : turn)));
    } finally {
      setPending(false);
    }
  };

  const handleNewSession = async () => {
    if (pending) return;
    if (dbSessionId) {
      await deleteDbChatSession(dbSessionId);
      setDbSessionId(null);
    }
    setTurns([]);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(getSessionStorageKey(user?.id));
      } catch {
        return;
      }
    }
  };

  const activeModel = (models.data ?? []).find((model) => model.id === modelId && model.available) ?? null;
  const sessionTurnCount = turns.filter((turn) => turn.answer !== null).length;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[580px] gap-3 pt-1">
      <header className="shrink-0 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[20px] font-medium tracking-tight text-foreground">AI Knowledge Assistant</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Ask questions about your organization&apos;s knowledge. Answers are grounded in real-time by your local Ollama LLM and vector store.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ReasoningModelSelector models={models.data ?? []} selectedId={modelId} onSelect={setModelId} />
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card/50 px-3.5 py-2 backdrop-blur-xl">
            <div><p className="text-[10px] text-muted-foreground">Department</p><p className="text-[12px] text-foreground">{profile?.department ?? "—"}</p></div>
            <span className="h-6 w-px bg-hairline" />
            <div><p className="text-[10px] text-muted-foreground">Access scope</p><p className="text-[12px] text-foreground">{access.data?.knowledgeAccess ?? "Unavailable"}</p></div>
          </div>
          {sessionTurnCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-hairline bg-card/50 px-3 py-2 backdrop-blur-xl">
              <span className="text-[10.5px] text-muted-foreground">{sessionTurnCount} exchange{sessionTurnCount === 1 ? "" : "s"}</span>
              <span className="h-3.5 w-px bg-hairline" />
              <button id="new-session-btn" type="button" onClick={() => void handleNewSession()} disabled={pending} title="Start a new conversation session" className="flex items-center gap-1.5 rounded-lg border border-hairline bg-secondary/40 px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"><Trash2 className="size-3" />Clear session</button>
              <button id="new-chat-btn" type="button" onClick={() => void handleNewSession()} disabled={pending} title="Start a fresh conversation" className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10.5px] text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-40"><PlusCircle className="size-3" />New chat</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-3 xl:flex-row xl:items-stretch">
        <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-2xl border border-hairline bg-card/40 p-3 backdrop-blur-xl">
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
            <AssistantConversation turns={turns} userName={actor} pending={pending} providerConfigured={true} retrievalConnected={true} />
          </div>
          {canQuery ? (
            <div className="shrink-0 pt-2 border-t border-hairline/50 mt-2 bg-card/20">
              <AssistantComposer onSubmit={(submission) => void handleAsk(submission)} tools={tools.data ?? []} pending={pending} suggestions={turns.length ? [] : (suggestions.data ?? [])} activeModelLabel={activeModel?.shortLabel ?? ""} />
              {turns.length > 0 && !pending && <p className="mt-1 text-center text-[10.5px] text-muted-foreground">Session continues · {sessionTurnCount} exchange{sessionTurnCount === 1 ? "" : "s"} in this session · <button type="button" onClick={() => void handleNewSession()} className="underline underline-offset-2 hover:text-foreground">Start new session</button></p>}
            </div>
          ) : <p className="shrink-0 mt-2 rounded-2xl border border-hairline bg-card/50 px-4 py-3 text-[12.5px] text-muted-foreground">Your role does not have permission to query the assistant.</p>}
        </div>

        <div className="shrink-0 xl:w-[320px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
          <AssistantContextPanel capabilities={capabilities.data ?? []} user={user} accessScope={access.data?.knowledgeAccess ?? "Unavailable"} />
        </div>
      </div>
    </div>
  );
}

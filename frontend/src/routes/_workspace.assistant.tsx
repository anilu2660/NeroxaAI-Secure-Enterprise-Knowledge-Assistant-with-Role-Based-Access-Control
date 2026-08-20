import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { MessageSquarePlus, PlusCircle, Trash2 } from "lucide-react";
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
  fetchDbChatSessionDetails,
  fetchUserChatSessions,
  sendDbChatMessage,
  getAccessProfile,
  getAssistantCapabilities,
  getAssistantTools,
  getReasoningModels,
  getSuggestedQueries,
  type DbChatSession,
} from "@/api/workspace-service";

import { RoleGuard } from "@/roles/components/RoleGuard";

export const Route = createFileRoute("/_workspace/assistant")({
  validateSearch: z.object({
    result: z.string().optional(),
    q: z.string().optional(),
    session: z.string().optional(),
  }),
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
  component: AssistantRoute,
});

function AssistantRoute() {
  return (
    <RoleGuard permission="assistant:query">
      <AssistantPage />
    </RoleGuard>
  );
}

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
    if (!assistantMsg) {
      // Do not convert orphaned user queries without an assistant response into fake interrupted cards
      continue;
    }
    i++;

    let execution = normalizeExecution(
      (assistantMsg as typeof assistantMsg & { execution_metadata?: unknown }).execution_metadata,
    );
    const rawSources = (assistantMsg?.sources as any[]) || [];
    if (execution && (!execution.sources || execution.sources.length === 0) && rawSources.length > 0) {
      execution = {
        ...execution,
        sources: normalizeExecution({ sources: rawSources })?.sources ?? [],
      };
    }
    const lowMsg = assistantMsg.content.toLowerCase();
    const isAccessDenied = lowMsg.startsWith("access denied");
    const isInsufficientContext =
      isAccessDenied ||
      lowMsg.includes("cannot find sufficient information") ||
      lowMsg.includes("could not find sufficient information") ||
      lowMsg.includes("no authorized enterprise information") ||
      lowMsg.includes("not authorized to access") ||
      lowMsg.includes("no relevant documents") ||
      lowMsg.includes("cannot answer this question based on the provided context") ||
      lowMsg.includes("security alert");

    if (isInsufficientContext && execution) {
      execution = { ...execution, sources: [], chunksRetrieved: 0 };
    }

    const citations: Citation[] = isInsufficientContext
      ? []
      : execution
        ? executionToCitations(execution)
        : rawSources.map((src: any, idx: number) => ({
            id: `cit_${idx}`,
            documentId: src.document_id || src.id || `doc_${idx}`,
            documentTitle: src.document_title || src.title || "Document",
            department: src.department,
            ...(src.page_number && !isNaN(Number(src.page_number)) ? { page: Number(src.page_number) } : {}),
          }));

    const answerObj: AssistantAnswer = {
      id: assistantMsg.id,
      query: msg.content,
      answer: assistantMsg.content,
      status: "live",
      keyReferences: isInsufficientContext
        ? []
        : (citations.map((citation) => citation.snippet).filter(Boolean).slice(0, 3) as string[]),
      citations,
      grounded: !isInsufficientContext && citations.length > 0,
      retrievalStatus: isAccessDenied
        ? "Access Restricted (RBAC)"
        : isInsufficientContext
          ? "No Context Gathered"
          : citations.length > 0
            ? "Retrieved securely (RBAC filtered)"
            : "Direct LLM Response",
      createdAt: assistantMsg.created_at,
      modelId: execution?.model ?? "qwen2.5:3b",
      modelLabel: execution?.model ? `Ollama (${execution.model})` : "Ollama (Qwen 2.5:3B)",
      execution,
    };

    turns.push({ id: msg.id, question: msg.content, askedAt: msg.created_at, answer: answerObj });
  }

  return turns;
}

function AssistantPage() {
  const { session, can } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session: targetSessionId } = Route.useSearch();
  const user = session?.user ?? null;
  const actor = user?.name ?? "";
  const canQuery = can("assistant:query");

  const [turns, setTurns] = useState<AssistantTurn[]>(() => loadPersistedTurns(user?.id));
  const [dbSessionId, setDbSessionId] = useState<string | null>(targetSessionId ?? null);
  const [pending, setPending] = useState(false);
  const [modelId, setModelId] = useState<string | null>(defaultReasoningModelId);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSession() {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("neroxa.token") : null;
      if (!token || !user?.id) return;

      if (targetSessionId) {
        // Fetch detailed session with messages
        const detailed = await fetchDbChatSessionDetails(targetSessionId);
        if (cancelled) return;
        if (detailed && detailed.messages && detailed.messages.length > 0) {
          setDbSessionId(detailed.id);
          const loadedTurns = dbSessionToTurns(detailed);
          setTurns(loadedTurns);
          persistTurns(loadedTurns, user.id);
          return;
        }

        const dbSessions = await fetchUserChatSessions();
        if (cancelled) return;
        const found = dbSessions.find((s) => s.id === targetSessionId);
        if (found) {
          setDbSessionId(found.id);
          const loadedTurns = dbSessionToTurns(found);
          setTurns(loadedTurns);
          persistTurns(loadedTurns, user.id);
          return;
        }
      }
    }

    void loadActiveSession();

    const handleSelectSessionEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ sessionId: string }>;
      if (customEv.detail?.sessionId) {
        void fetchDbChatSessionDetails(customEv.detail.sessionId).then((detailed: DbChatSession | null) => {
          if (detailed) {
            setDbSessionId(detailed.id);
            const loadedTurns = dbSessionToTurns(detailed);
            setTurns(loadedTurns);
            persistTurns(loadedTurns, user?.id);
          }
        });
      }
    };

    const handleNewChatEvent = () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setDbSessionId(null);
      setTurns([]);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(getSessionStorageKey(user?.id));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("neroxa:select-session", handleSelectSessionEvent);
    window.addEventListener("neroxa:new-chat", handleNewChatEvent);

    return () => {
      cancelled = true;
      window.removeEventListener("neroxa:select-session", handleSelectSessionEvent);
      window.removeEventListener("neroxa:new-chat", handleNewChatEvent);
    };
  }, [user?.id, targetSessionId]);

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

  const abortRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setPending(false);
    setTurns((current) =>
      current.map((turn) =>
        turn.answer === null
          ? {
              ...turn,
              answer: {
                id: `stopped_${Date.now()}`,
                query: turn.question,
                answer: "Generation stopped by user.",
                status: "live",
                keyReferences: [],
                citations: [],
                grounded: false,
                retrievalStatus: "Cancelled by User",
                createdAt: new Date().toISOString(),
                modelId: modelId || "qwen2.5-local",
                modelLabel: "Stopped",
              },
            }
          : turn,
      ),
    );
  };

  const handleAsk = async (submission: ComposerSubmission) => {
    const { question, attachments, webSearch, toolIds } = submission;
    const turnId = `turn_${Date.now()}`;
    setTurns((current) => [...current, { id: turnId, question, askedAt: new Date().toISOString(), answer: null }]);
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

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
        const dbMsg = await sendDbChatMessage(currentSessionId, question, {
          signal: controller.signal,
          webSearch,
          toolIds,
        });
        if (dbMsg) {
          let execution = normalizeExecution(
            (dbMsg as typeof dbMsg & { execution_metadata?: unknown }).execution_metadata,
          );
          const lowContent = dbMsg.content.toLowerCase();
          const isAccessDenied = lowContent.startsWith("access denied");
          const isInsufficientContext =
            isAccessDenied ||
            lowContent.includes("cannot find sufficient information") ||
            lowContent.includes("could not find sufficient information") ||
            lowContent.includes("no authorized enterprise information") ||
            lowContent.includes("not authorized to access") ||
            lowContent.includes("no relevant documents") ||
            lowContent.includes("cannot answer this question based on the provided context") ||
            lowContent.includes("security alert");

          if (isInsufficientContext && execution) {
            execution = { ...execution, sources: [], chunksRetrieved: 0 };
          }

          const allowCitations = toolIds.includes("citations") && !isInsufficientContext;
          const citations: Citation[] = allowCitations
            ? (execution
                ? executionToCitations(execution)
                : ((dbMsg.sources as any[]) || []).map((src: any, idx: number) => ({
                    id: `cit_${idx}`,
                    documentId: src.document_id || src.id || `doc_${idx}`,
                    documentTitle: src.document_title || src.title || "Document",
                    department: src.department,
                    ...(src.page_number && !isNaN(Number(src.page_number)) ? { page: Number(src.page_number) } : {}),
                  })))
            : [];

          answer = {
            id: dbMsg.id,
            query: question,
            answer: dbMsg.content,
            status: "live",
            keyReferences: allowCitations
              ? (citations.map((citation) => citation.snippet).filter(Boolean).slice(0, 3) as string[])
              : [],
            citations,
            grounded: allowCitations && citations.length > 0,
            retrievalStatus: isAccessDenied
              ? "Access Restricted (RBAC)"
              : isInsufficientContext
                ? "No Context Gathered"
                : allowCitations && citations.length > 0
                  ? "Retrieved securely (RBAC filtered)"
                  : "Direct LLM Response",
            createdAt: dbMsg.created_at || new Date().toISOString(),
            modelId: execution?.model ?? "qwen2.5:3b",
            modelLabel: execution?.model ? `Ollama (${execution.model})` : "Ollama (Qwen 2.5:3B)",
            execution: allowCitations ? execution : execution ? { ...execution, sources: [] } : null,
          };
        }
      }

      if (!answer && !controller.signal.aborted) {
        answer = await askAssistant({
          question,
          modelId,
          attachments,
          webSearch,
          toolIds,
          signal: controller.signal,
          ...(actor ? { actor } : {}),
        });
        if (answer && !toolIds.includes("citations")) {
          answer = {
            ...answer,
            citations: [],
            keyReferences: [],
            grounded: false,
          };
        }
      }

      if (!controller.signal.aborted) {
        setTurns((current) => current.map((turn) => (turn.id === turnId ? { ...turn, answer } : turn)));
        await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }
    } catch {
      if (controller.signal.aborted) return;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setPending(false);
    }
  };

  const handleNewSession = async () => {
    if (pending) return;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setDbSessionId(null);
    setTurns([]);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(getSessionStorageKey(user?.id));
      } catch {
        return;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    navigate({ to: "/assistant", search: {} as any });
  };

  const activeModel = (models.data ?? []).find((model) => model.id === modelId && model.available) ?? null;
  const sessionTurnCount = turns.filter((turn) => turn.answer !== null).length;

  return (
    <div className="flex flex-col h-[calc(100svh-8.5rem)] sm:h-[calc(100vh-100px)] min-h-[460px] sm:min-h-[580px] gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
      {/* Assistant Header */}
      <header className="shrink-0 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[17px] sm:text-[20px] font-semibold sm:font-medium tracking-tight text-foreground">
              AI Knowledge Assistant
            </h1>
            <span className="inline-flex sm:hidden items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9.5px] font-mono text-primary">
              Air-gapped
            </span>
          </div>
          <p className="mt-0.5 text-[11px] sm:text-[12px] text-muted-foreground line-clamp-1 sm:line-clamp-none">
            Grounded answers from your internal documents with deterministic RBAC.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <ReasoningModelSelector models={models.data ?? []} selectedId={modelId} onSelect={setModelId} />

          <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-hairline bg-card/50 px-3.5 py-1.5 backdrop-blur-xl">
            <div>
              <p className="text-[9.5px] text-muted-foreground">Department</p>
              <p className="text-[11.5px] font-medium text-foreground">{profile?.department ?? "—"}</p>
            </div>
            <span className="h-5 w-px bg-hairline" />
            <div>
              <p className="text-[9.5px] text-muted-foreground">Access scope</p>
              <p className="text-[11.5px] font-medium text-foreground">{access.data?.knowledgeAccess ?? "Protected"}</p>
            </div>
          </div>

          {sessionTurnCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-card/50 px-2.5 py-1 backdrop-blur-xl text-[10.5px]">
              <span className="text-muted-foreground hidden xs:inline">{sessionTurnCount} msg</span>
              <button
                id="new-session-btn"
                type="button"
                onClick={() => void handleNewSession()}
                disabled={pending}
                title="Clear session"
                className="flex items-center gap-1 rounded-md border border-hairline bg-secondary/40 px-1.5 py-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <Trash2 className="size-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button
                id="new-chat-btn"
                type="button"
                onClick={() => void handleNewSession()}
                disabled={pending}
                title="New chat"
                className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 font-medium"
              >
                <PlusCircle className="size-3" />
                <span>New</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Conversation & Context Area */}
      <div className="flex flex-1 min-h-0 gap-3 xl:flex-row xl:items-stretch">
        <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-2xl border border-hairline bg-card/40 p-2 sm:p-3 backdrop-blur-xl shadow-xs">
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-0.5 sm:pr-1">
            <AssistantConversation
              turns={turns}
              userName={actor}
              pending={pending}
              providerConfigured={true}
              retrievalConnected={true}
              onSelectSuggestion={(prompt) =>
                void handleAsk({ question: prompt, attachments: [], webSearch: false, toolIds: [] })
              }
            />
          </div>

          {canQuery ? (
            <div className="shrink-0 pt-1.5 sm:pt-2 border-t border-hairline/50 mt-1.5 sm:mt-2 bg-card/20">
              <AssistantComposer
                onSubmit={(submission) => void handleAsk(submission)}
                onStop={handleStop}
                tools={tools.data ?? []}
                pending={pending}
                suggestions={turns.length ? [] : (suggestions.data ?? [])}
                activeModelLabel={activeModel?.shortLabel ?? ""}
              />
              {turns.length > 0 && !pending && (
                <p className="mt-1 text-center text-[10px] text-muted-foreground hidden sm:block">
                  Session active · {sessionTurnCount} exchange{sessionTurnCount === 1 ? "" : "s"} ·{" "}
                  <button
                    type="button"
                    onClick={() => void handleNewSession()}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    New session
                  </button>
                </p>
              )}
            </div>
          ) : (
            <p className="shrink-0 mt-2 rounded-2xl border border-hairline bg-card/50 px-4 py-3 text-[12.5px] text-muted-foreground">
              Your role does not have permission to query the assistant.
            </p>
          )}
        </div>

        {/* Desktop Context Panel */}
        <div className="hidden xl:block shrink-0 xl:w-[320px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
          <AssistantContextPanel
            capabilities={capabilities.data ?? []}
            user={user}
            accessScope={access.data?.knowledgeAccess ?? "Unavailable"}
          />
        </div>
      </div>
    </div>
  );
}

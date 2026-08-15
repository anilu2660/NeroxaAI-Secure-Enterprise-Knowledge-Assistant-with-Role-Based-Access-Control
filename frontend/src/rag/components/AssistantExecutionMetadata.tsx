import { Bot, ChevronDown, ChevronRight, Globe, Database, Wrench, Zap, CheckCircle2, XCircle, MinusCircle, FileText } from "lucide-react";
import { useState } from "react";
import type { AgentExecutionStep, AssistantQueryResponse } from "@/api/assistant-types";

function routeLabel(route: AssistantQueryResponse["route"]): string {
  switch (route) {
    case "casual": return "Casual LLM";
    case "enterprise": return "Enterprise RAG";
    case "web": return "Web Search";
    case "hybrid": return "Hybrid Search";
    case "tool": return "Tool Calling";
    case "agent": return "AI Agent";
  }
}

function routeIcon(route: AssistantQueryResponse["route"]) {
  if (route === "web") return Globe;
  if (route === "tool") return Wrench;
  if (route === "agent") return Bot;
  if (route === "casual") return Zap;
  return Database;
}

function stepLabel(type: AgentExecutionStep["type"]): string {
  if (type === "rag") return "Enterprise RAG";
  if (type === "web") return "Web Search";
  return "Tool";
}

function StepStatus({ status }: { status: AgentExecutionStep["status"] }) {
  if (status === "success") return <CheckCircle2 className="size-3 text-emerald-400" />;
  if (status === "failed") return <XCircle className="size-3 text-destructive" />;
  return <MinusCircle className="size-3 text-muted-foreground" />;
}

function safeToolResult(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.slice(0, 500);
  try {
    return JSON.stringify(value, null, 2).slice(0, 1000);
  } catch {
    return "Tool returned a non-displayable result.";
  }
}

export function AssistantExecutionMetadata({ data }: { data: AssistantQueryResponse }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = routeIcon(data.route);
  const confidence = data.routeConfidence == null ? null : `${Math.round(data.routeConfidence * 100)}%`;
  const steps = data.agentSteps.length ? data.agentSteps : data.agentPlan?.steps ?? [];
  const isAgent = data.route === "agent" || steps.length > 0;
  const toolResult = safeToolResult(data.toolResult);
  const hasSources = Array.isArray(data.sources) && data.sources.length > 0;

  const hasExtraInfo =
    data.cached ||
    data.chunksRetrieved > 0 ||
    Boolean(data.toolName && data.toolStatus) ||
    data.webSearchStatus === "success" ||
    isAgent ||
    Boolean(data.rewrittenQuery) ||
    Boolean(toolResult) ||
    hasSources;

  if (data.route === "casual" && !hasExtraInfo) {
    return null;
  }

  return (
    <div className="mt-2 rounded-xl border border-hairline bg-secondary/20">
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-foreground/80">
          <Icon className="size-3" />
          {routeLabel(data.route)}
          {confidence ? <span className="text-muted-foreground">{confidence}</span> : null}
        </span>
        {data.cached ? <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">Semantic cache hit</span> : null}
        {data.chunksRetrieved > 0 ? <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">{data.chunksRetrieved} retrieved</span> : null}
        {data.toolName && data.toolStatus ? <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">{data.toolName}: {data.toolStatus}</span> : null}
        {data.webSearchStatus === "success" ? <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">Web sources used</span> : null}
        {(isAgent || data.rewrittenQuery || toolResult || hasSources) ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] text-muted-foreground hover:bg-accent/60 hover:text-foreground" aria-expanded={expanded}>
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            {expanded ? "Hide execution" : "View execution"}
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-t border-hairline/60 px-2.5 py-2.5 space-y-2.5">
          {data.rewrittenQuery ? (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Rewritten query</p>
              <p className="mt-1 rounded-lg border border-hairline bg-card/40 px-2.5 py-2 text-[11.5px] text-foreground/80">{data.rewrittenQuery}</p>
            </div>
          ) : null}

          {hasSources ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Retrieved Context Chunks ({data.sources.length})
                </p>
              </div>
              <div className="mt-1.5 space-y-1.5">
                {data.sources.map((source: any, index: number) => {
                  const title = source.title || source.documentTitle || source.document_title || "Document";
                  const page = source.page ?? source.page_number;
                  const dept = source.department || "Enterprise Knowledge";
                  const snippet = source.snippet || source.content || "";

                  return (
                    <div
                      key={source.id || index}
                      className="rounded-lg border border-hairline bg-card/40 p-2.5 text-[11.5px]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10.5px] font-medium text-foreground/90">
                        <span className="flex items-center gap-1.5">
                          <FileText className="size-3 text-primary" />
                          <span className="truncate max-w-[320px] font-semibold">{title}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {dept} {page ? `· Page ${page}` : ""}
                        </span>
                      </div>
                      {snippet ? (
                        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/90 bg-secondary/20 p-2 rounded border border-hairline/40 font-mono text-[10.5px] whitespace-pre-wrap">
                          {snippet}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isAgent ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Agent execution plan</p>
                <span className="text-[10px] text-muted-foreground">{steps.length} step{steps.length === 1 ? "" : "s"}</span>
              </div>
              {steps.length ? (
                <ol className="mt-1.5 space-y-1.5">
                  {steps.map((step) => (
                    <li key={step.id} className="flex items-start gap-2 rounded-lg border border-hairline bg-card/35 px-2.5 py-2">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-hairline bg-secondary/40 text-[9px] text-muted-foreground">{step.id}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-medium text-muted-foreground">{stepLabel(step.type)}</span>
                          {step.toolName ? <span className="rounded bg-secondary/50 px-1.5 py-0.5 text-[9.5px] text-foreground/70">{step.toolName}</span> : null}
                          <StepStatus status={step.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">{step.task}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-1 text-[11px] text-muted-foreground">No execution steps were returned.</p>}
            </div>
          ) : null}

          {data.toolName && toolResult ? (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tool result</p>
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-hairline bg-card/50 p-2.5 text-[10.5px] leading-relaxed text-foreground/75">{toolResult}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

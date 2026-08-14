import { Bot, Globe, Database, Wrench, Zap } from "lucide-react";
import type { AssistantQueryResponse } from "@/api/assistant-types";

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

export function AssistantExecutionMetadata({ data }: { data: AssistantQueryResponse }) {
  const Icon = routeIcon(data.route);
  const confidence = data.routeConfidence == null ? null : `${Math.round(data.routeConfidence * 100)}%`;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Assistant execution details">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-foreground/80">
        <Icon className="size-3" />
        {routeLabel(data.route)}
        {confidence ? <span className="text-muted-foreground">{confidence}</span> : null}
      </span>
      {data.cached ? (
        <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">
          Semantic cache hit
        </span>
      ) : null}
      {data.chunksRetrieved > 0 ? (
        <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">
          {data.chunksRetrieved} retrieved
        </span>
      ) : null}
      {data.toolName && data.toolStatus ? (
        <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">
          {data.toolName}: {data.toolStatus}
        </span>
      ) : null}
      {data.webSearchStatus === "success" ? (
        <span className="rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground">
          Web sources used
        </span>
      ) : null}
    </div>
  );
}

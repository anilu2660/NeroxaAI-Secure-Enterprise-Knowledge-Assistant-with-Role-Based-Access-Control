import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import type { AssistantAnswer } from "@/api/types";

export function LastAiAnswerPanel({ answer }: { answer: AssistantAnswer | null }) {
  return (
    <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[13.5px] font-medium text-foreground">Last AI Answer</h2>
        <span className="shrink-0 rounded-md border border-hairline px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-muted-foreground">
          Session only
        </span>
      </div>

      {answer ? (
        <div className="mt-2.5 rounded-xl border border-hairline bg-secondary/30 p-3">
          <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Query</p>
          <p className="mt-0.5 text-[12.5px] text-foreground">{answer.query}</p>

          <p className="mt-2.5 text-[12px] leading-relaxed text-foreground/85">{answer.answer}</p>

          {answer.citations.length ? (
            <>
              <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                Cited sources
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {answer.citations.map((citation) => (
                  <Link
                    key={citation.id}
                    to="/documents/$documentId"
                    params={{ documentId: citation.documentId }}
                    search={citation.page ? { page: citation.page } : {}}
                    className="rounded-md border border-hairline bg-card/70 px-2 py-1 text-[10.5px] text-foreground/85 transition-colors hover:bg-accent"
                  >
                    {citation.documentTitle}
                    {citation.page ? ` · p.${citation.page}` : ""}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-[10.5px] text-muted-foreground">
              {answer.execution?.route === "casual"
                ? "Conversational response — no external retrieval required."
                : answer.execution?.route === "web"
                  ? "Web search response — web sources used."
                  : "Direct response from Ollama local LLM."}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2.5 rounded-xl border border-dashed border-hairline bg-secondary/20 px-3 py-4">
          <MessageSquare className="size-4 text-muted-foreground" />
          <p className="mt-2 text-[12.5px] text-foreground/85">No AI answers yet</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Questions you submit in this session appear here. Answers require a connected AI
            provider.
          </p>
        </div>
      )}
    </section>
  );
}

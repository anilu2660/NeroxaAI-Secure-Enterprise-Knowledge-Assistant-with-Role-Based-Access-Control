import { Link } from "@tanstack/react-router";
import { MessageSquare, Sparkles } from "lucide-react";
import type { AssistantAnswer } from "@/api/types";

export function LastAiAnswerPanel({ answer }: { answer: AssistantAnswer | null }) {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
            <Sparkles className="size-4.5" />
          </span>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Last AI Answer</h2>
            <p className="text-[11px] text-muted-foreground">Most recent session response</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Session Only
        </span>
      </div>

      {answer ? (
        <div className="mt-4 rounded-2xl border border-hairline bg-secondary/25 p-4 shadow-xs">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Query
          </p>
          <p className="mt-1 text-[13px] font-medium text-foreground">&ldquo;{answer.query}&rdquo;</p>

          <div className="mt-3 pt-3 border-t border-hairline/60">
            <p className="text-[12.5px] leading-relaxed text-foreground/90">{answer.answer}</p>
          </div>

          {answer.citations.length ? (
            <div className="mt-3.5 pt-3 border-t border-hairline/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cited sources
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {answer.citations.map((citation) => (
                  <Link
                    key={citation.id}
                    to="/documents/$documentId"
                    params={{ documentId: citation.documentId }}
                    search={citation.page ? { page: citation.page } : {}}
                    className="rounded-xl border border-hairline bg-card/80 px-2.5 py-1 text-[11px] font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card"
                  >
                    {citation.documentTitle}
                    {citation.page ? ` · p.${citation.page}` : ""}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {answer.execution?.route === "casual"
                ? "Conversational response — no external retrieval required."
                : answer.execution?.route === "web"
                  ? "Web search response — web sources used."
                  : "Direct response from Ollama local LLM."}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-hairline/80 bg-secondary/20 p-6 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-2xl border border-hairline bg-secondary/40 text-muted-foreground shadow-xs">
            <MessageSquare className="size-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-foreground">No AI answers yet</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Questions you submit in this session appear here. Answers require a connected AI provider.
          </p>
        </div>
      )}
    </section>
  );
}

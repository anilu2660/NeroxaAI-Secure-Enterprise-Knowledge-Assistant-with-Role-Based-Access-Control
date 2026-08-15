import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCheck, CircleSlash, Copy, Cpu, ExternalLink, FileText, Lock, MessagesSquare, ShieldCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import type { AssistantTurn } from "@/api/types";
import { Markdown, MarkdownSkeleton } from "@/shared/components/ui/markdown";
import { submitFeedbackToDb } from "@/api/workspace-service";
import { StatusPill } from "@/shared/components/ui/status-pill";
import { AssistantExecutionMetadata } from "./AssistantExecutionMetadata";

function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U"; }
function timeLabel(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
function deduplicateCitations<T extends { documentTitle: string; department?: string | null }>(citations: T[]): T[] { const seen = new Set<string>(); return citations.filter((cit) => { const key = `${cit.documentTitle}:${cit.department || ""}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
function ServiceStatus({ label, ok }: { label: string; ok: boolean }) { return <StatusPill tone={ok ? "success" : "neutral"} icon={<span className="size-1.5 rounded-full bg-current" />}>{label} · {ok ? "Connected" : "Not configured"}</StatusPill>; }

function AnswerFeedback({ query, answer, citationsCount = 0 }: { query?: string; answer: string; citationsCount?: number }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null); const [copied, setCopied] = useState(false);
  const handleVote = async (next: "up" | "down") => { const nextVote = vote === next ? null : next; setVote(nextVote); if (nextVote) await submitFeedbackToDb({ query: query || "User AI Assistant Query", answer, rating: nextVote === "up" ? 1 : -1, chunks_retrieved: citationsCount }); };
  const handleCopy = async () => { try { await navigator.clipboard.writeText(answer); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ } };
  return <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-hairline/60 pt-3"><span className="mr-1 text-[10px] text-muted-foreground">Helpful?</span><button type="button" aria-label="Thumbs up" aria-pressed={vote === "up"} onClick={() => handleVote("up")} className={`grid size-7 place-items-center rounded-lg border border-hairline transition-colors ${vote === "up" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><ThumbsUp className="size-3.5" /></button><button type="button" aria-label="Thumbs down" aria-pressed={vote === "down"} onClick={() => handleVote("down")} className={`grid size-7 place-items-center rounded-lg border border-hairline transition-colors ${vote === "down" ? "border-destructive/40 bg-destructive/15 text-destructive" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><ThumbsDown className="size-3.5" /></button><span className="mx-1 h-3.5 w-px bg-hairline" /><button type="button" aria-label="Copy answer" onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-hairline px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-accent/60 hover:text-foreground">{copied ? <><CheckCheck className="size-3 text-emerald-400" />Copied</> : <><Copy className="size-3" />Copy</>}</button>{vote ? <span className="ml-1 text-[10px] text-muted-foreground">Thanks for the feedback.</span> : null}</div>;
}

export function AssistantConversation({ turns, userName, pending, providerConfigured = false, retrievalConnected = false }: { turns: AssistantTurn[]; userName: string; pending: boolean; providerConfigured?: boolean; retrievalConnected?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null); useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, pending]);
  if (!turns.length) return <div className="flex min-h-[420px] items-center justify-center px-4 py-10"><div className="w-full max-w-xl text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_40px_rgba(99,102,241,0.12)]"><MessagesSquare className="size-5" /></div><p className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">Ask Neroxa anything</p><p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-muted-foreground">Search your authorized enterprise knowledge and receive grounded answers with citations, access-aware retrieval, and source context.</p><div className="mt-5 flex flex-wrap items-center justify-center gap-2"><ServiceStatus label="AI inference" ok={providerConfigured} /><ServiceStatus label="Secure retrieval" ok={retrievalConnected} /></div></div></div>;
  return <div className="mx-auto w-full max-w-4xl space-y-5 px-1 py-1">
    {turns.map((turn) => <div key={turn.id} className="space-y-3">
      <article className="flex gap-3 px-2"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary text-[10px] font-semibold text-foreground">{initials(userName)}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-foreground">{userName || "You"}</span><span className="text-[10px] text-muted-foreground">{timeLabel(turn.askedAt)}</span></div><p className="mt-1.5 text-[13px] leading-relaxed text-foreground/90">{turn.question}</p></div></article>
      <article className="rounded-2xl border border-hairline bg-card/65 p-4 shadow-sm backdrop-blur-xl sm:p-5"><header className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-[10px] font-bold text-primary-foreground">N</span><div><p className="font-display text-[12px] font-semibold text-foreground">NeroxaAI</p><div className="flex items-center gap-2 text-[9.5px] text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-400" />Secure response</div></div></div><div className="flex flex-wrap items-center gap-1.5">{turn.answer?.modelLabel ? <StatusPill icon={<Cpu className="size-3" />}>{turn.answer.modelLabel}</StatusPill> : turn.answer ? <StatusPill icon={<CircleSlash className="size-3" />}>No model configured</StatusPill> : null}{turn.answer?.retrievalStatus ? <StatusPill tone="accent" icon={<ShieldCheck className="size-3" />}>{turn.answer.retrievalStatus}</StatusPill> : null}</div></header>
        {turn.answer ? <div className="mt-4"><div className="prose prose-invert max-w-none pl-0 text-[13px] leading-7">{turn.answer.answer.toLowerCase().startsWith("access denied") ? <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.08] p-4"><span className="grid size-8 shrink-0 place-items-center rounded-xl border border-destructive/30 bg-destructive/10"><Lock className="size-3.5 text-destructive" /></span><div><p className="text-[12.5px] font-semibold text-destructive">Access denied</p><p className="mt-1 text-[12px] leading-relaxed text-foreground/75">{turn.answer.answer.replace(/^access denied\.?\s*/i, "")}</p></div></div> : <Markdown content={turn.answer.answer} />}</div>
          {turn.answer.execution ? <AssistantExecutionMetadata data={turn.answer.execution} /> : null}
          {turn.answer.keyReferences.length ? <div className="mt-4 rounded-xl border border-hairline bg-secondary/20 p-3.5"><p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Key references</p><ul className="mt-2 space-y-1.5">{turn.answer.keyReferences.map((reference, i) => <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-foreground/75"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />{reference}</li>)}</ul></div> : null}
          {(() => {
            const route = turn.answer.execution?.route || "enterprise";
            const isCasual = route === "casual";
            const isWeb = route === "web";
            const hasCitations = turn.answer.citations.length > 0;
            if (!hasCitations || isCasual) return null;

            return (
              <div className="mt-4 rounded-xl border border-hairline bg-background/30 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-primary" />
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {isWeb ? "Web Sources" : "Sources"}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {turn.answer.citations.length} citation{turn.answer.citations.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  {deduplicateCitations(turn.answer.citations).map((citation) =>
                    citation.url ? (
                      <a
                        key={citation.id}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-hairline bg-card/55 px-3 py-2.5 transition-all hover:border-primary/25 hover:bg-card"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-foreground/90">
                            {citation.documentTitle}
                          </span>
                          <span className="mt-0.5 block truncate text-[9.5px] text-muted-foreground">
                            {citation.department ?? "Web source"}
                          </span>
                        </span>
                        <ExternalLink className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </a>
                    ) : (
                      <Link
                        key={citation.id}
                        to="/documents/$documentId"
                        params={{ documentId: citation.documentId }}
                        search={{ ...(citation.page ? { page: citation.page } : {}), from: "assistant" as const }}
                        className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-hairline bg-card/55 px-3 py-2.5 transition-all hover:border-primary/25 hover:bg-card"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-foreground/90">
                            {citation.documentTitle}
                          </span>
                          <span className="mt-0.5 block truncate text-[9.5px] text-muted-foreground">
                            {citation.department ?? "Enterprise knowledge"}
                            {citation.page ? ` · p.${citation.page}` : ""}
                          </span>
                        </span>
                        <ExternalLink className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    ),
                  )}
                </div>
              </div>
            );
          })()}
          {!turn.answer.answer.toLowerCase().startsWith("access denied") ? <AnswerFeedback query={turn.question} answer={turn.answer.answer} citationsCount={turn.answer.citations.length} /> : null}
        </div> : <div className="mt-4"><MarkdownSkeleton /></div>}
      </article>
    </div>)}
    {pending && turns[turns.length - 1]?.answer !== null ? <div className="mx-auto max-w-4xl rounded-2xl border border-hairline bg-card/50 p-5"><MarkdownSkeleton /></div> : null}<div ref={bottomRef} />
  </div>;
}

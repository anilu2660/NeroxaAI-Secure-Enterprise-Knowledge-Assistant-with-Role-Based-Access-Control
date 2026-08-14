import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCheck, CircleSlash, Copy, Cpu, ExternalLink, FileText, Lock, MessagesSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import type { AssistantTurn } from "@/api/types";
import { Markdown, MarkdownSkeleton } from "@/shared/components/ui/markdown";
import { submitFeedbackToDb } from "@/api/workspace-service";
import { AssistantExecutionMetadata } from "./AssistantExecutionMetadata";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function deduplicateCitations<T extends { documentTitle: string; department?: string }>(citations: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const cit of citations) {
    const key = `${cit.documentTitle}:${cit.department || ""}`;
    if (!seen.has(key)) { seen.add(key); result.push(cit); }
  }
  return result;
}

function ServiceStatus({ label, ok }: { label: string; ok: boolean }) {
  return <span className="flex items-center gap-1.5 rounded-md border border-hairline bg-secondary/35 px-2 py-1 text-[10.5px] text-muted-foreground"><span aria-hidden className={`size-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-muted-foreground/60"}`} />{label}: {ok ? "Connected" : "Not configured"}</span>;
}

function AnswerFeedback({ query, answer, citationsCount = 0 }: { query?: string; answer: string; citationsCount?: number }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const handleVote = async (next: "up" | "down") => {
    const nextVote = vote === next ? null : next;
    setVote(nextVote);
    if (nextVote) await submitFeedbackToDb({ query: query || "User AI Assistant Query", answer, rating: nextVote === "up" ? 1 : -1, chunks_retrieved: citationsCount });
  };
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(answer); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };
  return (
    <div className="mt-3 flex items-center gap-1 border-t border-hairline pt-2.5">
      <span className="mr-1 text-[10.5px] text-muted-foreground">Was this helpful?</span>
      <button type="button" aria-label="Thumbs up" aria-pressed={vote === "up"} onClick={() => handleVote("up")} title="Helpful" className={`grid size-7 place-items-center rounded-lg border border-hairline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${vote === "up" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><ThumbsUp className="size-3.5" /></button>
      <button type="button" aria-label="Thumbs down" aria-pressed={vote === "down"} onClick={() => handleVote("down")} title="Not helpful" className={`grid size-7 place-items-center rounded-lg border border-hairline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${vote === "down" ? "border-destructive/40 bg-destructive/15 text-destructive" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><ThumbsDown className="size-3.5" /></button>
      <span className="mx-1 h-3.5 w-px bg-hairline" />
      <button type="button" aria-label="Copy answer" onClick={handleCopy} title={copied ? "Copied!" : "Copy answer to clipboard"} className="flex items-center gap-1.5 rounded-lg border border-hairline px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{copied ? <><CheckCheck className="size-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="size-3" />Copy</>}</button>
      {vote ? <span className="ml-2 text-[10.5px] text-muted-foreground">{vote === "up" ? "Thanks for the feedback! 👍" : "We'll work on improving this. 👎"}</span> : null}
    </div>
  );
}

export function AssistantConversation({ turns, userName, pending, providerConfigured = false, retrievalConnected = false }: { turns: AssistantTurn[]; userName: string; pending: boolean; providerConfigured?: boolean; retrievalConnected?: boolean; }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, pending]);

  if (!turns.length) {
    return <div className="rounded-2xl border border-hairline bg-card/35 px-5 py-6 text-center backdrop-blur-xl"><div className="mx-auto max-w-[52ch]"><span className="mx-auto grid size-8 place-items-center rounded-xl border border-hairline bg-secondary/50"><MessagesSquare className="size-4 text-muted-foreground" /></span><p className="mt-2.5 font-display text-[15px] font-medium text-foreground">Start a conversation</p><p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Ask questions about your organization&apos;s knowledge. NeroxaAI retrieves authorized information and provides grounded answers with citations.</p><div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5"><ServiceStatus label="AI inference" ok={providerConfigured} /><ServiceStatus label="Retrieval" ok={retrievalConnected} /></div></div></div>;
  }

  return <div className="space-y-3">
    {turns.map((turn) => <div key={turn.id} className="space-y-2">
      <article className="rounded-2xl border border-hairline bg-secondary/25 px-4 py-3"><header className="flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-semibold text-primary">{initials(userName)}</span><span className="text-[12.5px] font-medium text-foreground">{userName || "You"}</span></div><span className="text-[11px] text-muted-foreground">{timeLabel(turn.askedAt)}</span></header><p className="mt-2 pl-[38px] text-[13.5px] leading-relaxed text-foreground">{turn.question}</p></article>
      <article className="rounded-2xl border border-hairline bg-card/55 p-4 backdrop-blur-xl"><header className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/12 text-[11px] font-semibold text-primary">N</span><span className="font-display text-[13.5px] font-medium text-foreground">NeroxaAI</span></div><div className="flex flex-wrap items-center gap-2">{turn.answer?.modelLabel ? <span className="flex items-center gap-1.5 rounded-md border border-hairline bg-secondary/40 px-1.5 py-0.5 text-[10.5px] text-foreground/80"><Cpu className="size-3" />{turn.answer.modelLabel}</span> : turn.answer ? <span className="flex items-center gap-1.5 rounded-md border border-hairline px-1.5 py-0.5 text-[10.5px] text-muted-foreground"><CircleSlash className="size-3" />No model configured</span> : null}{turn.answer ? <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{turn.answer.retrievalStatus}</span> : null}{turn.answer ? <span className="text-[11px] text-muted-foreground">{timeLabel(turn.answer.createdAt)}</span> : null}</div></header>
        {turn.answer ? <div className="mt-3 pl-[38px]">
          {turn.answer.answer.toLowerCase().startsWith("access denied") ? <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.08] px-4 py-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-destructive/40 bg-destructive/15"><Lock className="size-3.5 text-destructive" /></span><div className="min-w-0 space-y-1"><p className="text-[13px] font-semibold text-destructive">Access Denied</p>{turn.answer.answer.replace(/^access denied\.?\s*/i, "").split("\n").map((line, i) => <p key={i} className="text-[12.5px] leading-relaxed text-foreground/80">{line}</p>)}</div></div> : <Markdown content={turn.answer.answer} />}
          {turn.answer.execution ? <AssistantExecutionMetadata data={turn.answer.execution} /> : null}
          {turn.answer.keyReferences.length ? <div className="mt-4"><p className="text-[12.5px] font-medium text-foreground">Key References</p><ul className="mt-1.5 space-y-1">{turn.answer.keyReferences.map((reference, i) => <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground/80"><span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground" />{reference}</li>)}</ul></div> : null}
          <div className="mt-3 border-t border-hairline/60 pt-2.5"><div className="flex items-center justify-between gap-2"><p className="text-[11.5px] font-medium text-foreground/80">Cited Sources</p><span className="text-[10.5px] text-muted-foreground">{turn.answer.citations.length} citation{turn.answer.citations.length === 1 ? "" : "s"}</span></div>{turn.answer.citations.length ? <div className="mt-2 flex flex-wrap gap-1.5">{deduplicateCitations(turn.answer.citations).map((citation) => <Link key={citation.id} to="/documents/$documentId" params={{ documentId: citation.documentId }} search={{ ...(citation.page ? { page: citation.page } : {}), from: "assistant" as const }} className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-secondary/35 px-2.5 py-1 text-[11.5px] text-foreground/85 transition-colors hover:bg-accent/60 hover:text-foreground"><FileText className="size-3 shrink-0 text-primary/70" /><span className="max-w-[220px] truncate">{citation.documentTitle}</span>{citation.department ? <span className="rounded bg-card/80 px-1 py-0.5 text-[9.5px] text-muted-foreground">{citation.department}</span> : null}{citation.page ? <span className="text-[10px] text-muted-foreground">p.{citation.page}</span> : null}<ExternalLink className="size-2.5 shrink-0 text-muted-foreground" /></Link>)}</div> : <p className="mt-1 text-[11px] text-muted-foreground">{turn.answer.answer.toLowerCase().startsWith("access denied") ? "No sources — access to this content is restricted for your role." : "No sources — no relevant documents were retrieved for this query."}</p>}</div>
          {!turn.answer.answer.toLowerCase().startsWith("access denied") ? <AnswerFeedback query={turn.question} answer={turn.answer.answer} citationsCount={turn.answer.citations.length} /> : null}
        </div> : <div className="mt-3 pl-[38px]"><MarkdownSkeleton /></div>}
      </article>
    </div>)}
    {pending && turns[turns.length - 1]?.answer !== null ? <div className="rounded-2xl border border-hairline bg-card/35 p-4 backdrop-blur-xl"><MarkdownSkeleton /></div> : null}
    <div ref={bottomRef} />
  </div>;
}

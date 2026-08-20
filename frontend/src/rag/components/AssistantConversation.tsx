import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, CircleSlash, Copy, Cpu, ExternalLink, FileText, Lock, MessagesSquare, ShieldCheck, ThumbsDown, ThumbsUp, Server, AlertTriangle, Sparkles } from "lucide-react";
import type { AssistantTurn } from "@/api/types";
import { Markdown, MarkdownSkeleton } from "@/shared/components/ui/markdown";
import { getApiUrl, submitFeedbackToDb } from "@/api/workspace-service";
import { StatusPill } from "@/shared/components/ui/status-pill";
import { AssistantExecutionMetadata } from "./AssistantExecutionMetadata";
import { NexoraLogo } from "@/shared/components/ui/NexoraLogo";

const GREETING_PHRASES = [
  {
    title: "Nexora AI",
    subtitle: "Secure Enterprise Knowledge & Intelligence Assistant",
    gradient: "from-sky-400 via-primary to-purple-400",
  },
  {
    title: "Hello, how can I help you today?",
    subtitle: "Ask questions about authorized policies, compliance, calculations, or enterprise knowledge.",
    gradient: "from-foreground via-foreground/95 to-primary",
  },
];

function AnimatedVanishingGreeting() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % GREETING_PHRASES.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [index]);

  const current = GREETING_PHRASES[index] ?? GREETING_PHRASES[0]!;

  return (
    <div className="min-h-[96px] flex flex-col items-center justify-center select-none [perspective:1200px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.title}
          initial={{
            opacity: 0,
            scale: 1.15,
            y: 8,
            filter: "blur(12px)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          exit={{
            opacity: 0,
            scale: 0.7,
            y: -10,
            filter: "blur(16px)",
          }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-center will-change-transform"
        >
          <h2
            className={`font-display text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r ${current.gradient} bg-clip-text text-transparent drop-shadow-sm`}
          >
            {current.title}
          </h2>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground/90 mx-auto">
            {current.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U"; }
function timeLabel(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
function deduplicateCitations<T extends { documentTitle: string; department?: string | null }>(citations: T[]): T[] { const seen = new Set<string>(); return citations.filter((cit) => { const key = `${cit.documentTitle}:${cit.department || ""}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
function ServiceStatus({ label, ok }: { label: string; ok: boolean }) { return <StatusPill tone={ok ? "success" : "neutral"} icon={<span className="size-1.5 rounded-full bg-current" />}>{label} · {ok ? "Connected" : "Not configured"}</StatusPill>; }

function isInsufficientAnswer(answerText?: string): boolean {
  if (!answerText) return false;
  const t = answerText.toLowerCase();
  return (
    t.includes("cannot find sufficient information") ||
    t.includes("could not find sufficient information") ||
    t.includes("no authorized enterprise information") ||
    t.includes("not authorized to access") ||
    t.includes("no relevant documents") ||
    t.includes("cannot answer this question based on the provided context") ||
    t.includes("security alert") ||
    t.startsWith("access denied")
  );
}

function AnswerFeedback({
  query,
  answer,
  citationsCount = 0,
}: {
  query?: string;
  answer: string;
  citationsCount?: number;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(null); const [copied, setCopied] = useState(false);
  const handleVote = async (next: "up" | "down") => { const nextVote = vote === next ? null : next; setVote(nextVote); if (nextVote) await submitFeedbackToDb({ query: query || "User AI Assistant Query", answer, rating: nextVote === "up" ? 1 : -1, chunks_retrieved: citationsCount }); };
  const handleCopy = async () => { try { await navigator.clipboard.writeText(answer); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ } };
  return <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-hairline/60 pt-3"><span className="mr-1 text-[10px] text-muted-foreground">Helpful?</span><button type="button" aria-label="Thumbs up" aria-pressed={vote === "up"} onClick={() => handleVote("up")} className={`grid size-7 place-items-center rounded-lg border border-hairline transition-colors ${vote === "up" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><ThumbsUp className="size-3.5" /></button><button type="button" aria-label="Thumbs down" aria-pressed={vote === "down"} onClick={() => handleVote("down")} className={`grid size-7 place-items-center rounded-lg border border-hairline transition-colors ${vote === "down" ? "border-destructive/40 bg-destructive/15 text-destructive" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><ThumbsDown className="size-3.5" /></button><span className="mx-1 h-3.5 w-px bg-hairline" /><button type="button" aria-label="Copy answer" onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-hairline px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-accent/60 hover:text-foreground">{copied ? <><CheckCheck className="size-3 text-emerald-400" />Copied</> : <><Copy className="size-3" />Copy</>}</button>{vote ? <span className="ml-1 text-[10px] text-muted-foreground">Thanks for the feedback.</span> : null}</div>;
}

export function AssistantConversation({
  turns,
  userName,
  pending,
  providerConfigured = false,
  retrievalConnected = false,
  onSelectSuggestion,
}: {
  turns: AssistantTurn[];
  userName: string;
  pending: boolean;
  providerConfigured?: boolean;
  retrievalConnected?: boolean;
  onSelectSuggestion?: (suggestion: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendChecked, setBackendChecked] = useState(false);
  const [backendUrlConfigured, setBackendUrlConfigured] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending]);

  useEffect(() => {
    let cancelled = false;
    const configured = Boolean(
      (import.meta.env["VITE_API_URL"] as string | undefined)?.trim() ||
        (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.trim(),
    );
    setBackendUrlConfigured(configured);

    async function checkBackend() {
      if (!configured) {
        if (!cancelled) {
          setBackendConnected(false);
          setBackendChecked(true);
        }
        return;
      }

      try {
        const response = await fetch(getApiUrl("/health"), {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!cancelled) setBackendConnected(response.ok);
      } catch {
        if (!cancelled) setBackendConnected(false);
      } finally {
        if (!cancelled) setBackendChecked(true);
      }
    }

    void checkBackend();
    const interval = window.setInterval(() => void checkBackend(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const samplePrompts = [
    {
      icon: ShieldCheck,
      title: "Reimbursement Policy",
      prompt: "What is our reimbursement policy?",
      desc: "Retrieve claim limits & expense guidelines",
    },
    {
      icon: Lock,
      title: "Security Guidelines",
      prompt: "Show me the latest security guidelines",
      desc: "Access compliance & data protection protocols",
    },
    {
      icon: FileText,
      title: "Employee Leave Rules",
      prompt: "What are the employee leave rules?",
      desc: "Check annual, sick, and parental leave caps",
    },
    {
      icon: Cpu,
      title: "Department Briefing",
      prompt: "Summarize recent updates for Finance department",
      desc: "Get an instant summary of relevant sources",
    },
  ];

  if (!turns.length) {
    return (
      <div className="flex min-h-[460px] flex-col items-center justify-center px-4 py-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <NexoraLogo size={64} animated={true} withGlow={true} variant="floating" />
        </div>

        <AnimatedVanishingGreeting />

        {/* ChatGPT Style Prompt Starter Grid */}
        <div className="mt-6 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
          {samplePrompts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onSelectSuggestion?.(item.prompt)}
                className="group flex flex-col items-start rounded-2xl border border-hairline bg-card/60 p-4 text-left shadow-xs backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/85 hover:shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] text-muted-foreground/90 line-clamp-1">
                  &ldquo;{item.prompt}&rdquo;
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/75">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Status Indicators Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <StatusPill tone={providerConfigured ? "success" : "neutral"} icon={<span className="size-1.5 rounded-full bg-current" />}>AI inference · {providerConfigured ? "Connected" : "Not configured"}</StatusPill>
          <StatusPill tone={retrievalConnected ? "success" : "neutral"} icon={<span className="size-1.5 rounded-full bg-current" />}>Secure retrieval · {retrievalConnected ? "Connected" : "Not configured"}</StatusPill>
          <StatusPill
            tone={backendChecked ? (backendConnected ? "success" : "neutral") : "neutral"}
            icon={<Server className="size-3" />}
          >
            {backendChecked
              ? backendConnected
                ? "Backend API · Connected"
                : backendUrlConfigured
                  ? "Backend API · Offline"
                  : "Backend URL · Missing"
              : "Backend API · Checking"}
          </StatusPill>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-1 py-2">
      {turns.map((turn) => (
        <div key={turn.id} className="space-y-4">
          {/* User Message Bubble (ChatGPT Style Right-Aligned Card) */}
          <article className="flex items-start justify-end gap-3 px-2">
            <div className="max-w-[85%] rounded-3xl rounded-tr-md border border-hairline/80 bg-secondary/45 p-4 shadow-sm backdrop-blur-xl">
              <div className="mb-1 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">{userName || "You"}</span>
                <span>{timeLabel(turn.askedAt)}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-foreground">{turn.question}</p>
            </div>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-secondary text-[11px] font-semibold text-foreground border border-hairline shadow-sm">
              {initials(userName)}
            </span>
          </article>

          {/* Assistant Message Container (ChatGPT Left-Aligned Card) */}
          <article className="rounded-3xl border border-hairline/80 bg-gradient-to-br from-card/85 via-card/50 to-primary/[0.04] p-5 shadow-lg backdrop-blur-2xl sm:p-6 transition-all">
            <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
              <div className="flex items-center gap-3">
                <NexoraLogo size={32} animated={false} withGlow={false} variant="plain" />
                <div>
                  <h3 className="font-display text-[13px] font-semibold text-foreground">
                    Nexora AI Assistant
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Grounded &amp; RBAC Filtered
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {turn.answer?.modelLabel ? (
                  <StatusPill icon={<Cpu className="size-3" />}>
                    {turn.answer.modelLabel}
                  </StatusPill>
                ) : turn.answer ? (
                  <StatusPill icon={<CircleSlash className="size-3" />}>
                    No model configured
                  </StatusPill>
                ) : null}
                {turn.answer?.retrievalStatus ? (
                  <StatusPill tone="accent" icon={<ShieldCheck className="size-3" />}>
                    {turn.answer.retrievalStatus}
                  </StatusPill>
                ) : null}
              </div>
            </header>

            {turn.answer ? (
              <div className="mt-4 space-y-4">
                <div className="prose prose-invert max-w-none text-[13.5px] leading-relaxed">
                  {turn.answer.answer.toLowerCase().startsWith("access denied") ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/[0.08] p-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-destructive/30 bg-destructive/10">
                        <Lock className="size-4 text-destructive" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-destructive">Access denied</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-foreground/80">
                          {turn.answer.answer.replace(/^access denied\.?\s*/i, "")}
                        </p>
                      </div>
                    </div>
                  ) : turn.answer.status === "no-provider" ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                        <AlertTriangle className="size-4 text-amber-300" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-amber-200">
                          AI service unavailable
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-foreground/80">
                          {backendConnected
                            ? "The Railway backend is reachable, but the AI request failed. Check the Ollama Cloud configuration and backend logs."
                            : backendUrlConfigured
                              ? "The Railway backend is not reachable from this browser. Check the Railway URL, deployment, and CORS configuration."
                              : "The frontend has no Railway backend URL configured. Set VITE_API_URL in Vercel and redeploy."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Markdown content={turn.answer.answer} />
                  )}
                </div>

                {turn.answer.execution && !isInsufficientAnswer(turn.answer.answer) ? (
                  <AssistantExecutionMetadata data={turn.answer.execution} />
                ) : null}

                {!isInsufficientAnswer(turn.answer.answer) && turn.answer.keyReferences.length ? (
                  <div className="rounded-2xl border border-hairline bg-secondary/20 p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Key References
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {turn.answer.keyReferences.map((reference, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[12px] leading-relaxed text-foreground/80"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {reference}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {(() => {
                  if (isInsufficientAnswer(turn.answer.answer)) return null;

                  const route = turn.answer.execution?.route || "enterprise";
                  const isCasual = route === "casual";
                  const isWeb = route === "web";
                  const hasCitations = turn.answer.citations.length > 0;
                  if (!hasCitations || isCasual) return null;

                  return (
                    <div className="rounded-2xl border border-hairline bg-background/30 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-primary" />
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {isWeb ? "Web Sources" : "Retrieved Sources"}
                          </p>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground">
                          {turn.answer.citations.length} citation
                          {turn.answer.citations.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {deduplicateCitations(turn.answer.citations).map((citation) =>
                          citation.url ? (
                            <a
                              key={citation.id}
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-hairline bg-card/60 p-3 transition-all hover:border-primary/40 hover:bg-card shadow-xs"
                            >
                              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                <FileText className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11.5px] font-medium text-foreground">
                                  {citation.documentTitle}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                  {citation.department ?? "Web source"}
                                </span>
                              </span>
                              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </a>
                          ) : (
                            <Link
                              key={citation.id}
                              to="/documents/$documentId"
                              params={{ documentId: citation.documentId }}
                              search={{
                                ...(citation.page ? { page: citation.page } : {}),
                                from: "assistant" as const,
                              }}
                              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-hairline bg-card/60 p-3 transition-all hover:border-primary/40 hover:bg-card shadow-xs"
                            >
                              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                <FileText className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11.5px] font-medium text-foreground">
                                  {citation.documentTitle}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                  {citation.department ?? "Enterprise knowledge"}
                                  {citation.page ? ` · p.${citation.page}` : ""}
                                </span>
                              </span>
                              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  );
                })()}

                {!turn.answer.answer.toLowerCase().startsWith("access denied") &&
                turn.answer.status !== "no-provider" ? (
                  <AnswerFeedback
                    query={turn.question}
                    answer={turn.answer.answer}
                    citationsCount={turn.answer.citations.length}
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                <MarkdownSkeleton />
              </div>
            )}
          </article>
        </div>
      ))}
      {pending && turns[turns.length - 1]?.answer !== null ? (
        <div className="mx-auto max-w-4xl rounded-3xl border border-hairline bg-card/50 p-6">
          <MarkdownSkeleton />
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck,
  CircleSlash,
  Copy,
  Cpu,
  ExternalLink,
  FileText,
  Lock,
  MessagesSquare,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Server,
  AlertTriangle,
} from "lucide-react";
import type { AssistantTurn } from "@/api/types";
import { Markdown, MarkdownSkeleton } from "@/shared/components/ui/markdown";
import { getApiUrl, submitFeedbackToDb } from "@/api/workspace-service";
import { StatusPill } from "@/shared/components/ui/status-pill";
import { AssistantExecutionMetadata } from "./AssistantExecutionMetadata";
import { NexoraLogo } from "@/shared/components/ui/NexoraLogo";
import { useUserProfile } from "@/auth/use-user-profile";

const GREETING_PHRASES = [
  {
    title: "Nexora AI Assistant",
    subtitle: "Deterministic RBAC & Local Knowledge Retrieval",
  },
  {
    title: "What would you like to query?",
    subtitle: "Answers are strictly grounded in your authorized enterprise documents and policies.",
  },
];

function AnimatedVanishingGreeting() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % GREETING_PHRASES.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [index]);

  const current = GREETING_PHRASES[index] ?? GREETING_PHRASES[0]!;

  return (
    <div className="min-h-[72px] flex flex-col items-center justify-center select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="text-center"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {current.title}
          </h2>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground mx-auto">
            {current.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function deduplicateCitations<T extends { documentTitle: string; department?: string | null }>(
  citations: T[],
): T[] {
  const seen = new Set<string>();
  return citations.filter((cit) => {
    const key = `${cit.documentTitle}:${cit.department || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVote = async (next: "up" | "down") => {
    const nextVote = vote === next ? null : next;
    setVote(nextVote);
    if (nextVote) {
      await submitFeedbackToDb({
        query: query || "User AI Assistant Query",
        answer,
        rating: nextVote === "up" ? 1 : -1,
        chunks_retrieved: citationsCount,
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5 font-mono text-[11px]">
      <span className="mr-1 text-[10.5px] text-muted-foreground">Feedback:</span>
      <button
        type="button"
        aria-label="Thumbs up"
        aria-pressed={vote === "up"}
        onClick={() => handleVote("up")}
        className={`grid size-6 place-items-center rounded-[4px] border transition-colors cursor-pointer ${
          vote === "up"
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        <ThumbsUp className="size-3" />
      </button>

      <button
        type="button"
        aria-label="Thumbs down"
        aria-pressed={vote === "down"}
        onClick={() => handleVote("down")}
        className={`grid size-6 place-items-center rounded-[4px] border transition-colors cursor-pointer ${
          vote === "down"
            ? "border-destructive/40 bg-destructive/15 text-destructive"
            : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        <ThumbsDown className="size-3" />
      </button>

      <span className="mx-1 h-3.5 w-px bg-border" />

      <button
        type="button"
        aria-label="Copy answer"
        onClick={handleCopy}
        className="flex items-center gap-1 rounded-[4px] border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
      >
        {copied ? (
          <>
            <CheckCheck className="size-3 text-emerald-500" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3" /> Copy
          </>
        )}
      </button>

      {vote ? (
        <span className="ml-1 text-[10px] text-muted-foreground">Response logged to quality audit.</span>
      ) : null}
    </div>
  );
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
  const { profile, session } = useUserProfile();
  const userAvatarUrl = profile?.avatarUrl ?? session?.user?.avatarUrl ?? null;
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
      desc: "Get an instant summary of authorized sources",
    },
  ];

  if (!turns.length) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-8 text-center">
        <div className="mb-3 flex items-center justify-center">
          <NexoraLogo size={44} animated={false} withGlow={false} variant="plain" />
        </div>

        <AnimatedVanishingGreeting />

        {/* Prompt Starter Grid */}
        <div className="mt-6 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
          {samplePrompts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onSelectSuggestion?.(item.prompt)}
                className="group flex flex-col items-start rounded-[8px] border border-border bg-card p-3.5 text-left shadow-2xs transition-colors hover:border-primary/40 hover:bg-secondary/40 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-[4px] bg-secondary text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-[12px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-1">
                  &ldquo;{item.prompt}&rdquo;
                </p>
              </button>
            );
          })}
        </div>

        {/* Status Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1">
            <span
              className={`size-1.5 rounded-full ${providerConfigured ? "bg-emerald-500" : "bg-muted-foreground"}`}
            />
            Local Inference: {providerConfigured ? "Connected" : "Standby"}
          </span>

          <span className="flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1">
            <span
              className={`size-1.5 rounded-full ${retrievalConnected ? "bg-emerald-500" : "bg-muted-foreground"}`}
            />
            Vector RBAC: {retrievalConnected ? "Active" : "Standby"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-1 py-2">
      {turns.map((turn) => (
        <div key={turn.id} className="space-y-4">
          {/* User Message */}
          <div className="flex items-start justify-end gap-2.5 px-2">
            <div className="max-w-[82%] rounded-[8px] border border-border bg-secondary/60 px-4 py-2.5 shadow-2xs">
              <div className="mb-1 flex items-center justify-end gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="font-semibold text-foreground">{userName || "You"}</span>
                <span>{timeLabel(turn.askedAt)}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap">
                {turn.question}
              </p>
            </div>
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName || "You"}
                className="size-7 shrink-0 rounded-[6px] border border-border object-cover"
              />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-secondary text-[10.5px] font-mono font-semibold text-foreground border border-border">
                {initials(userName)}
              </span>
            )}
          </div>

          {/* Assistant Message */}
          <div className="rounded-[10px] border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
            {/* Header / Identity */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <NexoraLogo size={20} animated={false} withGlow={false} variant="plain" />
                <span className="font-display text-[13px] font-bold text-foreground">
                  Nexora AI
                </span>
                <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="size-1 rounded-full bg-emerald-500" /> Grounded &amp; RBAC Filtered
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                {turn.answer?.modelLabel ? (
                  <span className="rounded-[4px] border border-border bg-secondary/40 px-2 py-0.5 text-muted-foreground flex items-center gap-1">
                    <Cpu className="size-2.5 text-primary" /> {turn.answer.modelLabel}
                  </span>
                ) : null}
              </div>
            </div>

            {turn.answer ? (
              <div className="space-y-3 pt-1">
                <div className="prose prose-invert max-w-none text-[13.5px] leading-relaxed text-foreground/95">
                  {turn.answer.answer.toLowerCase().startsWith("access denied") ? (
                    <div className="flex items-start gap-3 rounded-[6px] border border-destructive/30 bg-destructive/[0.06] p-3.5 font-mono text-[12px]">
                      <Lock className="size-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-destructive">Access Denied (Deterministic RBAC Boundary)</p>
                        <p className="mt-1 text-muted-foreground leading-relaxed">
                          {turn.answer.answer.replace(/^access denied\.?\s*/i, "")}
                        </p>
                      </div>
                    </div>
                  ) : turn.answer.status === "no-provider" ? (
                    <div className="flex items-start gap-3 rounded-[6px] border border-amber-500/30 bg-amber-500/[0.06] p-3.5 font-mono text-[12px]">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-600 dark:text-amber-400">Local AI Inference Offline</p>
                        <p className="mt-1 text-muted-foreground leading-relaxed">
                          The local Ollama backend is currently unreachable. Ensure Ollama service is running on the local host or VPC.
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

                {/* Source Citations */}
                {(() => {
                  if (isInsufficientAnswer(turn.answer.answer)) return null;

                  const hasCitations = turn.answer.citations.length > 0;
                  if (!hasCitations) return null;

                  return (
                    <div className="rounded-[6px] border border-border bg-secondary/20 p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <FileText className="size-3 text-primary" /> Verified Citations
                        </span>
                        <span>{turn.answer.citations.length} document chunk(s)</span>
                      </div>

                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {deduplicateCitations(turn.answer.citations).map((citation) =>
                          citation.url ? (
                            <a
                              key={citation.id}
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11px] hover:border-primary/40 hover:bg-secondary/40 transition-colors"
                            >
                              <div className="truncate min-w-0">
                                <span className="font-medium text-foreground truncate block">
                                  {citation.documentTitle}
                                </span>
                                <span className="font-mono text-[9.5px] text-muted-foreground truncate block">
                                  {citation.department ?? "Web source"}
                                </span>
                              </div>
                              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
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
                              className="flex items-center justify-between gap-2 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11px] hover:border-primary/40 hover:bg-secondary/40 transition-colors"
                            >
                              <div className="truncate min-w-0">
                                <span className="font-medium text-foreground truncate block">
                                  {citation.documentTitle}
                                </span>
                                <span className="font-mono text-[9.5px] text-muted-foreground truncate block">
                                  {citation.department ?? "Knowledge"}
                                  {citation.page ? ` · p.${citation.page}` : ""}
                                </span>
                              </div>
                              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
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
              <MarkdownSkeleton />
            )}
          </div>
        </div>
      ))}

      {pending && turns[turns.length - 1]?.answer !== null ? (
        <div className="rounded-[10px] border border-border bg-card p-4 sm:p-5 shadow-xs">
          <MarkdownSkeleton />
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

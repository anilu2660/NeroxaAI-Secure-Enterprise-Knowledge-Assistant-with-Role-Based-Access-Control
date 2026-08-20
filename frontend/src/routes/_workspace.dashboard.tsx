import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Database,
  FileText,
  FolderOpen,
  Info,
  KeyRound,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { AiComposer } from "@/rag/components/AiComposer";
import { RecentActivityPanel } from "@/audit/components/RecentActivityPanel";
import { RecentDocumentsPanel } from "@/documents/components/RecentDocumentsPanel";
import { KnowledgeOverviewPanel } from "@/rag/components/KnowledgeOverviewPanel";
import { LastAiAnswerPanel } from "@/rag/components/LastAiAnswerPanel";
import { AccessPanel } from "@/roles/components/AccessPanel";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import type { AssistantAnswer } from "@/api/types";
import {
  getAccessProfile,
  getKnowledgeOverview,
  getLastAnswer,
  getRecentActivity,
  getRecentDocuments,
  getSuggestedQueries,
} from "@/api/workspace-service";
import { MetricCard } from "@/shared/components/ui/metric-card";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace Dashboard — NeroxaAI" },
      { name: "description", content: "Your NeroxaAI enterprise knowledge workspace." },
    ],
  }),
  component: DashboardPage,
});

function getTimeGreetingInfo(hour: number): { greeting: string; icon: string } {
  if (hour >= 0 && hour < 5) {
    return { greeting: "Good early morning", icon: "✨" };
  }
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", icon: "🌅" };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", icon: "☀️" };
  }
  if (hour >= 17 && hour < 22) {
    return { greeting: "Good evening", icon: "🌆" };
  }
  return { greeting: "Good night", icon: "🌙" };
}

function DashboardPage() {
  const { session, can } = useAuth();
  const { profile } = useUserProfile();
  const [lastAnswerOverride, setLastAnswerOverride] = useState<AssistantAnswer | null>(null);

  // Live time ticker state
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const actor = profile?.name ?? session?.user.name ?? "";
  const user = session?.user ?? null;
  const scopeKey = profile ? `${profile.role}:${profile.accessScope.join("|")}` : "";
  const identity = profile ? { role: profile.role, accessScope: profile.accessScope } : null;

  const documents = useQuery({
    queryKey: ["recent-documents", scopeKey],
    queryFn: () => getRecentDocuments(identity),
    enabled: !!profile,
  });
  const activity = useQuery({
    queryKey: ["recent-activity", actor, lastAnswerOverride?.id ?? ""],
    queryFn: () => getRecentActivity(actor),
    enabled: !!actor,
  });
  const overview = useQuery({
    queryKey: ["knowledge-overview", scopeKey],
    queryFn: () => getKnowledgeOverview(identity),
    enabled: !!profile,
  });
  const lastAnswer = useQuery({ queryKey: ["last-answer"], queryFn: getLastAnswer });
  const access = useQuery({
    queryKey: ["access-profile", profile?.id ?? user?.id ?? "", profile?.accessScope.join("|") ?? ""],
    queryFn: () => getAccessProfile(profile ?? user),
    enabled: !!user,
  });
  const suggestions = useQuery({ queryKey: ["suggested-queries"], queryFn: getSuggestedQueries });
  const answer = lastAnswerOverride ?? lastAnswer.data ?? null;

  const documentCount = overview.data?.accessibleDocuments ?? documents.data?.length ?? 0;
  const sourceCount = overview.data?.accessibleDocuments ?? documents.data?.length ?? 0;

  const { greeting, icon } = getTimeGreetingInfo(now.getHours());
  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const userName = profile?.name ?? session?.user.name ?? "User";

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-[8px] sm:rounded-[10px] border border-border bg-card p-4 sm:p-6 shadow-xs transition-all duration-300">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2 min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-secondary/50 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-mono text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>KNOWLEDGE WORKSPACE</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-secondary/30 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-mono text-muted-foreground">
                <span className="font-semibold text-foreground">{formattedTime}</span>
              </div>
            </div>

            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {userName} {icon}
            </h1>
            <p className="text-[12.5px] sm:text-[13.5px] leading-relaxed text-muted-foreground">
              Ask questions across indexed documents or query departmental knowledge under active RBAC policies.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
            <Link
              to="/assistant"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-primary px-4 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              <Bot className="size-4" />
              Open Assistant
            </Link>
          </div>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
        <MetricCard
          label="Knowledge Base"
          value={documentCount}
          detail="Authorized documents"
          icon={<FileText className="size-4 text-primary" />}
        />
        <MetricCard
          label="Connected Sources"
          value={sourceCount}
          detail="Indexed sources"
          icon={<Database className="size-4 text-primary" />}
        />
        <MetricCard
          label="Access Level"
          value={profile?.roleLabel?.split("·").pop()?.trim() ?? "Protected"}
          detail={profile?.department ?? "Role-aware"}
          icon={<ShieldCheck className="size-4 text-primary" />}
        />
        <MetricCard
          label="System Status"
          value="Active"
          detail="Local AI + RBAC"
          icon={<Activity className="size-4 text-emerald-400" />}
        />
      </div>

      {/* Interactive Quick Action Shortcut Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {can("assistant:query") ? (
          <Link
            to="/assistant"
            className="group flex items-center justify-between rounded-2xl border border-hairline bg-card/60 p-3.5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/85 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Bot className="size-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-medium text-foreground">AI Assistant</p>
                <p className="text-[10.5px] text-muted-foreground">Ask questions &amp; query</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ) : null}

        {can("documents:upload") ? (
          <Link
            to="/upload"
            className="group flex items-center justify-between rounded-2xl border border-hairline bg-card/60 p-3.5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/85 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <UploadCloud className="size-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-medium text-foreground">Upload Document</p>
                <p className="text-[10.5px] text-muted-foreground">Ingest knowledge file</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ) : null}

        {can("documents:read") ? (
          <Link
            to="/documents"
            className="group flex items-center justify-between rounded-2xl border border-hairline bg-card/60 p-3.5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/85 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <FolderOpen className="size-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-medium text-foreground">Documents</p>
                <p className="text-[10.5px] text-muted-foreground">Browse knowledge base</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ) : null}

        <Link
          to="/account"
          className="group flex items-center justify-between rounded-2xl border border-hairline bg-card/60 p-3.5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/85 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <KeyRound className="size-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-medium text-foreground">Your Account</p>
              <p className="text-[10.5px] text-muted-foreground">View profile &amp; status</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </div>

      {/* AI Assistant Knowledge Search Composer */}
      {can("assistant:query") ? (
        <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card/95 via-card/60 to-primary/[0.08] p-6 sm:p-7 shadow-2xl backdrop-blur-3xl transition-all duration-300 hover:border-primary/45">
          {/* Ambient Glow Mesh Orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl animate-pulse"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-purple-500/15 blur-3xl"
          />

          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 place-items-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 via-purple-500/20 to-primary/10 text-primary shadow-md shadow-primary/25 ring-2 ring-primary/20">
                  <Sparkles className="size-6 text-primary animate-pulse" />
                </span>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
                    Ask your enterprise knowledge base
                  </h2>
                  <p className="text-[12px] text-muted-foreground">
                    Answers are strictly scoped to the access assigned to your account.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3.5 py-1 text-[11.5px] font-semibold text-primary shadow-xs">
                <span className="size-2 rounded-full bg-primary animate-ping" />
                <ShieldCheck className="size-3.5" />
                RBAC Aware Retrieval
              </span>
            </div>

            <AiComposer
              suggestions={suggestions.data ?? []}
              actor={actor}
              onAnswer={setLastAnswerOverride}
            />
          </div>
        </section>
      ) : null}

      {/* Activity & AI Answer Panels */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <RecentActivityPanel entries={activity.data ?? []} />
        <LastAiAnswerPanel answer={answer} />
      </div>

      {/* Recent Documents & Overview */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <RecentDocumentsPanel documents={documents.data ?? []} />
        {overview.data ? <KnowledgeOverviewPanel overview={overview.data} /> : null}
      </div>

      {/* RBAC Access Overview */}
      {access.data && (profile ?? session) ? (
        <AccessPanel user={profile ?? (session as NonNullable<typeof session>).user} profile={access.data} />
      ) : null}
    </div>
  );
}

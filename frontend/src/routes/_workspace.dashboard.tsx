import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Database, FileText, Info, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AiComposer } from "@/rag/components/AiComposer";
import { RecentActivityPanel } from "@/audit/components/RecentActivityPanel";
import { RecentDocumentsPanel } from "@/documents/components/RecentDocumentsPanel";
import { KnowledgeOverviewPanel } from "@/rag/components/KnowledgeOverviewPanel";
import { LastAiAnswerPanel } from "@/rag/components/LastAiAnswerPanel";
import { AccessPanel } from "@/roles/components/AccessPanel";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import type { AssistantAnswer } from "@/api/types";
import { getAccessProfile, getKnowledgeOverview, getLastAnswer, getRecentActivity, getRecentDocuments, getSuggestedQueries } from "@/api/workspace-service";
import { MetricCard } from "@/shared/components/ui/metric-card";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusPill } from "@/shared/components/ui/status-pill";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace Dashboard — NeroxaAI" },
      { name: "description", content: "Your NeroxaAI enterprise knowledge workspace." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const [lastAnswerOverride, setLastAnswerOverride] = useState<AssistantAnswer | null>(null);
  const actor = profile?.name ?? session?.user.name ?? "";
  const user = session?.user ?? null;
  const scopeKey = profile ? `${profile.role}:${profile.accessScope.join("|")}` : "";
  const identity = profile ? { role: profile.role, accessScope: profile.accessScope } : null;

  const documents = useQuery({ queryKey: ["recent-documents", scopeKey], queryFn: () => getRecentDocuments(identity), enabled: !!profile });
  const activity = useQuery({ queryKey: ["recent-activity", actor, lastAnswerOverride?.id ?? ""], queryFn: () => getRecentActivity(actor), enabled: !!actor });
  const overview = useQuery({ queryKey: ["knowledge-overview", scopeKey], queryFn: () => getKnowledgeOverview(identity), enabled: !!profile });
  const lastAnswer = useQuery({ queryKey: ["last-answer"], queryFn: getLastAnswer });
  const access = useQuery({ queryKey: ["access-profile", profile?.id ?? user?.id ?? "", profile?.accessScope.join("|") ?? ""], queryFn: () => getAccessProfile(profile ?? user), enabled: !!user });
  const suggestions = useQuery({ queryKey: ["suggested-queries"], queryFn: getSuggestedQueries });
  const answer = lastAnswerOverride ?? lastAnswer.data ?? null;

  const documentCount = overview.data?.totalDocuments ?? documents.data?.length ?? 0;
  const sourceCount = overview.data?.totalSources ?? overview.data?.totalDocuments ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Enterprise knowledge workspace"
        title={`Welcome back, ${profile?.name ?? session?.user.name ?? "there"}`}
        description="Search authorized organizational knowledge, inspect sources, and manage your workspace from one secure surface."
        actions={<StatusPill tone="success" icon={<span className="size-1.5 rounded-full bg-current" />}>RAG services operational</StatusPill>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Knowledge" value={documentCount} detail="Authorized documents" icon={<FileText className="size-4" />} />
        <MetricCard label="Sources" value={sourceCount} detail="Indexed knowledge sources" icon={<Database className="size-4" />} />
        <MetricCard label="Access" value={profile?.roleLabel?.split("·").pop()?.trim() ?? "Protected"} detail={profile?.department ?? "Role-aware workspace"} icon={<ShieldCheck className="size-4" />} />
        <MetricCard label="Workspace" value="Active" detail="Local AI + secure retrieval" icon={<Activity className="size-4" />} />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-card/90 via-card/60 to-primary/[0.08] p-1 shadow-window backdrop-blur-xl">
        <div className="relative rounded-[20px] border border-white/[0.04] bg-background/35 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
                <div>
                  <h2 className="font-display text-sm font-semibold text-foreground">Ask your enterprise knowledge base</h2>
                  <p className="text-[10.5px] text-muted-foreground">Answers are scoped to the access assigned to your account.</p>
                </div>
              </div>
            </div>
            <StatusPill tone="accent" icon={<Info className="size-3" />}>RBAC aware</StatusPill>
          </div>
          <AiComposer suggestions={suggestions.data ?? []} actor={actor} onAnswer={setLastAnswerOverride} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <RecentActivityPanel entries={activity.data ?? []} />
        <LastAiAnswerPanel answer={answer} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <RecentDocumentsPanel documents={documents.data ?? []} />
        {overview.data ? <KnowledgeOverviewPanel overview={overview.data} /> : null}
      </div>

      {access.data && (profile ?? session) ? <AccessPanel user={profile ?? (session as NonNullable<typeof session>).user} profile={access.data} /> : null}
    </div>
  );
}

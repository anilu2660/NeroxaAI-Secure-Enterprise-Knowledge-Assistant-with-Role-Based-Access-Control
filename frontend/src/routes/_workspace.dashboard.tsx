import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Info } from "lucide-react";
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

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace Dashboard — NeroxaAI" },
      {
        name: "description",
        content:
          "Your NeroxaAI workspace prototype: ask questions and review your configured access scope.",
      },
      { property: "og:title", content: "Workspace Dashboard — NeroxaAI" },
      {
        property: "og:description",
        content:
          "Ask questions and review the access scope your administrator assigned to your account.",
      },
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

  // Scope identity comes from the administered user record, so the dashboard,
  // Documents library, and Your Access panel all agree on what is accessible.
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
    queryKey: [
      "access-profile",
      profile?.id ?? user?.id ?? "",
      profile?.accessScope.join("|") ?? "",
    ],
    queryFn: () => getAccessProfile(profile ?? user),
    enabled: !!user,
  });
  const suggestions = useQuery({ queryKey: ["suggested-queries"], queryFn: getSuggestedQueries });

  const answer = lastAnswerOverride ?? lastAnswer.data ?? null;

  return (
    <div className="flex flex-col gap-4 pt-1 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-card/60 px-5 py-4 backdrop-blur-xl">
          <div className="min-w-0">
            <h1 className="font-display text-[23px] font-medium tracking-tight text-foreground">
              Welcome back, {profile?.name ?? session?.user.name ?? ""}.
            </h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Connected to local Ollama LLM and Enterprise RAG Knowledge Base.
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-allowed/40 bg-allowed/10 px-3 py-1 text-[11.5px] text-allowed">
            <Info className="size-3.5" />
            Connected · Local LLM & RAG Active
          </span>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <AiComposer
            suggestions={suggestions.data ?? []}
            actor={actor}
            onAnswer={setLastAnswerOverride}
          />
          <RecentActivityPanel entries={activity.data ?? []} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <RecentDocumentsPanel documents={documents.data ?? []} />
          {overview.data ? <KnowledgeOverviewPanel overview={overview.data} /> : null}
          <LastAiAnswerPanel answer={answer} />
        </div>
      </div>

      {access.data && (profile ?? session) ? (
        <AccessPanel
          user={profile ?? (session as NonNullable<typeof session>).user}
          profile={access.data}
        />
      ) : null}
    </div>
  );
}

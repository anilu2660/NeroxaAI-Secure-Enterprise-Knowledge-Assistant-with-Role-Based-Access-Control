import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { AdminMetricCards } from "@/shared/components/admin/AdminMetricCards";
import { AdminControlsPanel } from "@/shared/components/admin/AdminControlsPanel";
import { AdminActivityPanel } from "@/audit/components/AdminActivityPanel";
import { AdminDocumentsOverviewPanel } from "@/documents/components/AdminDocumentsOverviewPanel";
import { AdminSecurityCard } from "@/shared/components/admin/AdminSecurityCard";
import { AdminSecurityPosture } from "@/shared/components/admin/AdminSecurityPosture";
import { useAuth } from "@/auth/auth-context";
import { getAdminSecurityContext } from "@/api/workspace-service";
import { getDependencyHealth, getLiveAdminActivity, getLiveAdminDocumentOverview, getLiveAdminMetrics } from "@/api/admin-live-service";

export const Route = createFileRoute("/_workspace/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — NeroxaAI" },
      { name: "description", content: "Administrator console for managing users, documents, access, and auditability across your organization's knowledge system." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  return <RoleGuard role="ADMIN"><AdminDashboardPage /></RoleGuard>;
}

function AdminDashboardPage() {
  const { session } = useAuth();
  const user = session?.user ?? null;

  const metrics = useQuery({ queryKey: ["admin-live-metrics"], queryFn: getLiveAdminMetrics, refetchInterval: 30000 });
  const activity = useQuery({ queryKey: ["admin-live-activity"], queryFn: getLiveAdminActivity, refetchInterval: 30000 });
  const documents = useQuery({ queryKey: ["admin-live-document-overview"], queryFn: getLiveAdminDocumentOverview, refetchInterval: 30000 });
  const dependencies = useQuery({ queryKey: ["dependency-health"], queryFn: getDependencyHealth, refetchInterval: 30000 });
  const security = useQuery({ queryKey: ["admin-security-context", user?.id ?? ""], queryFn: () => getAdminSecurityContext(user), enabled: !!user });

  const metricValues = metrics.data ?? [];
  const userCount = metricValues.find((item) => item.id === "total-users")?.value;
  const documentCount = metricValues.find((item) => item.id === "total-documents")?.value;
  const dependencyStatus = dependencies.data?.status === "healthy" ? "Protected" : dependencies.data?.status === "degraded" ? "Dependency issue" : "Checking";
  const dependencyDetail = dependencies.data
    ? `PostgreSQL: ${dependencies.data.postgres?.status ?? "unknown"} · Qdrant: ${dependencies.data.qdrant?.status ?? "unknown"}`
    : "Checking database and vector services…";

  return (
    <div className="space-y-3.5 pt-1">
      <header className="grid gap-3 rounded-2xl border border-hairline bg-card/60 px-5 py-4 backdrop-blur-xl xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[23px] font-medium tracking-tight text-foreground">Welcome back, {user?.name ?? ""}</h1>
            <ShieldCheck className="size-4 text-primary" />
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.08em] text-primary">{user?.role ?? ""}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">You are signed in as {user?.roleLabel ?? ""}</p>
          <p className="mt-1 max-w-[720px] text-[12.5px] leading-relaxed text-muted-foreground">Manage users, documents, access, and auditability across your organization's knowledge system.</p>
        </div>
        <AdminSecurityCard context={security.data ? { ...security.data, status: { label: dependencyStatus, detail: dependencyDetail } } : null} />
      </header>

      {metrics.isError || dependencies.isError ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[11px] text-amber-200">
          Live backend data could not be loaded. Verify VITE_API_URL, the Railway deployment, authentication token, PostgreSQL DATABASE_URL, and QDRANT_URL/QDRANT_API_KEY.
        </div>
      ) : null}

      <AdminMetricCards metrics={metricValues} />

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AdminSecurityPosture securityLabel={dependencyStatus} securityDetail={dependencyDetail} userCount={userCount} documentCount={documentCount} />
        <AdminControlsPanel />
      </div>

      <div className="grid gap-3.5 xl:grid-cols-2">
        <AdminActivityPanel entries={activity.data ?? []} />
        <AdminDocumentsOverviewPanel overview={documents.data ?? null} />
      </div>
    </div>
  );
}

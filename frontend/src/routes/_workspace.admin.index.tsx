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
  const userCountRaw = metricValues.find((item) => item.id === "total-users")?.value;
  const userCount = userCountRaw ? Number.parseInt(userCountRaw, 10) || undefined : undefined;
  const documentCountRaw = metricValues.find((item) => item.id === "total-documents")?.value;
  const documentCount = documentCountRaw ? Number.parseInt(documentCountRaw, 10) || undefined : undefined;
  const dependencyStatus = dependencies.data?.status === "healthy" ? "Protected" : dependencies.data?.status === "degraded" ? "Dependency issue" : "Checking";
  const dependencyDetail = dependencies.data
    ? `PostgreSQL: ${dependencies.data.postgres?.status ?? "unknown"} · Qdrant: ${dependencies.data.qdrant?.status ?? "unknown"}`
    : "Checking database and vector services…";

  return (
    <div className="space-y-6 pb-6 pt-1">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/50 to-primary/[0.08] p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-primary/20 blur-3xl animate-pulse"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 left-1/3 size-64 rounded-full bg-purple-500/15 blur-3xl"
        />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] xl:items-center">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3.5xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Welcome back,</span>
                <span className="bg-gradient-to-r from-primary via-purple-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
                  {user?.name ?? "Admin"}
                </span>
              </h1>
              <ShieldCheck className="size-5 text-primary" />
              <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-xs">
                {user?.role ?? "ADMIN"}
              </span>
            </div>
            <p className="text-[13px] font-medium text-muted-foreground">
              Signed in as <span className="text-foreground">{user?.roleLabel ?? "General Administrator"}</span>
            </p>
            <p className="max-w-[720px] text-[13px] leading-relaxed text-muted-foreground">
              Manage users, documents, access permissions, and auditability across your organization's knowledge system.
            </p>
          </div>

          <AdminSecurityCard context={security.data ?? null} />
        </div>
      </section>

      {metrics.isError || dependencies.isError ? (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-[12px] font-medium text-amber-300 backdrop-blur-md">
          Live backend data could not be loaded. Verify VITE_API_URL, the Railway deployment, authentication token, PostgreSQL DATABASE_URL, and QDRANT_URL/QDRANT_API_KEY.
        </div>
      ) : null}

      {/* Admin Metrics Grid */}
      <AdminMetricCards metrics={metricValues} />

      {/* Security Posture & Admin Controls */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AdminSecurityPosture
          securityLabel={dependencyStatus}
          securityDetail={dependencyDetail}
          userCount={userCount}
          documentCount={documentCount}
        />
        <AdminControlsPanel />
      </div>

      {/* Activity & Document Overview */}
      <div className="grid gap-5 xl:grid-cols-2">
        <AdminActivityPanel entries={activity.data ?? []} />
        <AdminDocumentsOverviewPanel overview={documents.data ?? null} />
      </div>
    </div>
  );
}

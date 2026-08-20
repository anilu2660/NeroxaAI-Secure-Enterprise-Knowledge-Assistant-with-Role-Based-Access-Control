import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Info, KeyRound, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { AccessResolutionChain } from "@/roles/components/AccessResolutionChain";
import { PermissionMatrix } from "@/roles/components/PermissionMatrix";
import {
  AccessScopePanel,
  DepartmentPanel,
  RelatedSurfacesPanel,
  RoleOverviewCards,
} from "@/roles/components/AccessControlPanels";
import { useAuth } from "@/auth/auth-context";
import { getAccessControlModel, updateRolePermission } from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/access")({
  head: () => ({
    meta: [
      { title: "Access Control — NeroxaAI Admin" },
      {
        name: "description",
        content:
          "Administrators review organizational roles and the permissions that determine access to documents, knowledge, and administrative features in NeroxaAI.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Access Control — NeroxaAI Admin" },
      {
        property: "og:description",
        content: "Roles, permissions, departments, and knowledge access scopes across the NeroxaAI workspace.",
      },
    ],
  }),
  component: AccessControlRoute,
});

function AccessControlRoute() {
  return (
    <RoleGuard role="ADMIN" permission="access:manage">
      <AccessControlPage />
    </RoleGuard>
  );
}

function AccessControlPage() {
  const { session } = useAuth();
  const admin = session?.user ?? null;
  const [notice, setNotice] = useState<string | null>(null);

  const model = useQuery({ queryKey: ["access-control"], queryFn: getAccessControlModel });
  const loading = model.isPending;
  const data = model.data;

  const attemptChange = async (roleKey: string, permissionKey: string) => {
    const result = await updateRolePermission({ roleKey, permissionKey });
    setNotice(result.status.detail);
    await model.refetch();
  };

  return (
    <section className="space-y-6 pb-6 pt-1">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="mt-1 grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-md shadow-primary/20 ring-2 ring-primary/20">
            <KeyRound className="size-6 text-primary" />
          </span>
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
              <Link to="/admin" className="transition-colors hover:text-primary">
                Admin Dashboard
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground/90 font-semibold">Access Control</span>
            </nav>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Access Control &amp; RBAC
            </h1>
            <p className="mt-1 max-w-[680px] text-[12.5px] leading-relaxed text-muted-foreground">
              Define who can access enterprise knowledge, administrative capabilities, and protected resources
              {admin ? ` · reviewed as ${admin.name}, ${admin.department}` : ""}.
            </p>
          </div>
        </div>
        <span className="flex h-10 items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 text-[12px] font-semibold text-emerald-400 shadow-xs">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          RBAC Policy Engine Active
        </span>
      </header>

      {/* Top Banner Grid */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex items-start gap-3 rounded-[8px] sm:rounded-[10px] border border-border bg-card p-4 sm:p-5 shadow-xs">
          <span className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-primary/30 bg-primary/10 text-primary">
            <Info className="size-4.5" />
          </span>
          <div>
            <p className="font-display text-[13.5px] font-semibold text-foreground">
              Policy resolution is evaluated before knowledge retrieval.
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Role &rarr; department &rarr; access scope &rarr; resource permission. Deny by default when a required policy decision is unavailable.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[8px] sm:rounded-[10px] border border-border bg-card p-4 sm:p-5 shadow-xs">
          <span className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="size-4.5" />
          </span>
          <div>
            <p className="font-display text-[13.5px] font-semibold text-foreground">
              Current Policy State
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {data?.status?.detail ?? "FastAPI RBAC middleware actively enforces role & department query boundaries."}
            </p>
          </div>
        </div>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-[6px] border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-[12px] font-medium text-primary">
          <Info className="size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {/* Resolution Chain */}
      <AccessResolutionChain steps={data?.resolutionChain ?? []} />

      {/* Role Overview */}
      <RoleOverviewCards roles={data?.roles ?? []} loading={loading} />

      {/* Permission Matrix & Side Panels */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">Permission Matrix</h2>
              <p className="text-[11px] text-muted-foreground">Toggle workspace &amp; administrative capabilities per role</p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10.5px] font-bold text-primary">
              Principle of Least Privilege
            </span>
          </div>
          <PermissionMatrix
            roles={data?.roles ?? []}
            permissions={data?.permissions ?? []}
            loading={loading}
            onAttemptChange={attemptChange}
          />
        </div>

        <div className="space-y-4">
          <AccessScopePanel scopes={data?.accessScopes ?? []} loading={loading} />
          <DepartmentPanel departments={data?.departments ?? []} loading={loading} />
          <RelatedSurfacesPanel />
        </div>
      </div>
    </section>
  );
}

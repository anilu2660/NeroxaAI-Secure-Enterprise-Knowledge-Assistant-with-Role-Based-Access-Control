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
        content:
          "Roles, permissions, departments, and knowledge access scopes across the NeroxaAI workspace.",
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
    const result = await updateRolePermission({ roleKey, permissionKey, granted: true });
    if (!result.applied) {
      setNotice(result.status.detail);
    }
  };

  return (
    <section className="space-y-3.5 pt-1">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/12">
            <KeyRound className="size-5 text-primary" />
          </span>
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Link to="/admin" className="transition-colors hover:text-foreground">
                Admin Dashboard
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground/80">Access Control</span>
            </nav>
            <h1 className="mt-1 font-display text-[27px] font-medium tracking-tight text-foreground">
              Access Control
            </h1>
            <p className="mt-0.5 max-w-[680px] text-[12.5px] leading-relaxed text-muted-foreground">
              Manage organizational roles and the permissions that determine access to documents,
              knowledge, administrative features, and protected resources
              {admin ? ` · reviewed as ${admin.name}, ${admin.department}` : ""}.
            </p>
          </div>
        </div>
        <span className="flex h-10 items-center gap-2 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-muted-foreground">
          <ShieldCheck className="size-4 text-primary/80" />
          Roles &amp; Permissions
        </span>
      </header>

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3.5 backdrop-blur-xl">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/[0.08]">
            <Info className="size-[18px] text-primary/85" />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] text-foreground">
              {data?.status.label ?? "Checking the access control service…"}
            </p>
            <p className="mt-0.5 max-w-[900px] text-[12px] leading-relaxed text-muted-foreground">
              {data?.status.detail ??
                "Role and permission definitions are being loaded from the current application model."}
            </p>
          </div>
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-hairline bg-card/55 px-3.5 py-2.5 text-[12px] leading-relaxed text-muted-foreground"
        >
          {notice}
        </p>
      ) : null}

      <AccessResolutionChain steps={data?.resolutionChain ?? []} />

      <RoleOverviewCards roles={data?.roles ?? []} loading={loading} />

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] text-foreground">Permission matrix</h2>
            <span className="text-[11px] text-muted-foreground">
              Administrative capabilities are never granted to standard users
            </span>
          </div>
          <PermissionMatrix
            roles={data?.roles ?? []}
            permissions={data?.permissions ?? []}
            loading={loading}
            onAttemptChange={attemptChange}
          />
        </div>

        <div className="space-y-3.5">
          <AccessScopePanel scopes={data?.accessScopes ?? []} loading={loading} />
          <DepartmentPanel departments={data?.departments ?? []} loading={loading} />
          <RelatedSurfacesPanel />
        </div>
      </div>
    </section>
  );
}

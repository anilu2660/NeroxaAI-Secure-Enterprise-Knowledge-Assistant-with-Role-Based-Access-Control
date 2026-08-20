import { Link } from "@tanstack/react-router";
import { Building2, ExternalLink, Globe, Layers, Lock, ShieldCheck, Users } from "lucide-react";
import type { AccessScopeDefinition, DepartmentDefinition, RoleDefinition } from "@/api/types";

const scopeIcon: Record<string, typeof Globe> = {
  general: Globe,
  department: Building2,
  restricted: Lock,
};

export function RoleOverviewCards({
  roles,
  loading,
}: {
  roles: RoleDefinition[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-3.5 sm:grid-cols-2">
        {[0, 1].map((card) => (
          <div key={card} className="h-[145px] animate-pulse rounded-3xl bg-secondary/35" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {roles.map((role) => (
        <article
          key={role.key}
          className="group rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-sm ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                {role.key === "ADMIN" ? (
                  <ShieldCheck className="size-5 text-primary" />
                ) : (
                  <Users className="size-5 text-sky-400" />
                )}
              </span>
              <div>
                <p className="font-display text-[15px] font-bold text-foreground">{role.label}</p>
                <span className="inline-block rounded-full bg-secondary/60 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground border border-hairline/60 mt-0.5">
                  {role.key}
                </span>
              </div>
            </div>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              {role.assignedUsers === null
                ? "Active in directory"
                : `${role.assignedUsers} member${role.assignedUsers === 1 ? "" : "s"}`}
            </span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            {role.description}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-hairline/80">
            <span className="text-[11px] font-semibold text-muted-foreground">Capabilities:</span>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {role.permissions?.length ?? 0}
            </span>
            <span className="ml-2 text-[11px] font-semibold text-muted-foreground">Scopes:</span>
            {(role.accessScopes ?? []).map((scope) => (
              <span
                key={scope}
                className="rounded-md border border-hairline bg-secondary/50 px-2 py-0.5 text-[11px] font-medium capitalize text-foreground/90"
              >
                {scope}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function AccessScopePanel({
  scopes,
  loading,
}: {
  scopes: AccessScopeDefinition[];
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <header className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <Layers className="size-4" />
        </span>
        <h2 className="font-display text-[13.5px] font-semibold text-foreground">Knowledge Access Scopes</h2>
      </header>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Document-level retrieval boundary controlling vector partition visibility across user departments.
      </p>
      <div className="mt-3 space-y-2.5">
        {loading
          ? [0, 1, 2].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-2xl bg-secondary/35" />
            ))
          : scopes.map((scope) => {
              const Icon = scopeIcon[scope.key] ?? Globe;
              return (
                <div
                  key={scope.key}
                  className="rounded-2xl border border-hairline/70 bg-secondary/20 p-3 transition-all hover:bg-secondary/35"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-foreground">
                      <Icon className="size-4 text-primary" />
                      {scope.label}
                    </p>
                    <span className="rounded-md bg-secondary/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-hairline">
                      {scope.roles.join(" · ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                    {scope.description}
                    {scope.departmentBound ? " Membership follows the member's department." : ""}
                  </p>
                </div>
              );
            })}
      </div>
    </section>
  );
}

export function DepartmentPanel({
  departments,
  loading,
}: {
  departments: DepartmentDefinition[];
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <header className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <Building2 className="size-4" />
        </span>
        <h2 className="font-display text-[13.5px] font-semibold text-foreground">Departments</h2>
      </header>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Organizational boundaries defining knowledge custody and user membership.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {loading ? (
          <div className="h-9 w-full animate-pulse rounded-2xl bg-secondary/35" />
        ) : departments.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No departments available</p>
        ) : (
          departments.map((department) => (
            <span
              key={department.key}
              title={department.description}
              className="rounded-xl border border-hairline/80 bg-secondary/30 px-3 py-1.5 text-[12px] font-semibold text-foreground/90 shadow-xs transition-all hover:border-primary/40 hover:bg-card"
            >
              {department.label}
            </span>
          ))
        )}
      </div>
    </section>
  );
}

export function RelatedSurfacesPanel() {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <header className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <ExternalLink className="size-4" />
        </span>
        <h2 className="font-display text-[13.5px] font-semibold text-foreground">Where Assignments Happen</h2>
      </header>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Roles &amp; permissions configure capabilities. User and document assignments live on dedicated surfaces.
      </p>
      <div className="mt-3.5 space-y-2">
        <Link
          to="/users"
          className="flex items-center justify-between gap-2.5 rounded-2xl border border-hairline/80 bg-secondary/25 p-3 text-[12.5px] font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm"
        >
          <span className="flex items-center gap-2.5">
            <Users className="size-4 text-primary" />
            User Management
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">Assign role &amp; department →</span>
        </Link>
        <Link
          to="/admin/documents"
          className="flex items-center justify-between gap-2.5 rounded-2xl border border-hairline/80 bg-secondary/25 p-3 text-[12.5px] font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm"
        >
          <span className="flex items-center gap-2.5">
            <Layers className="size-4 text-primary" />
            Document Management
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">Set document access scope →</span>
        </Link>
      </div>
    </section>
  );
}

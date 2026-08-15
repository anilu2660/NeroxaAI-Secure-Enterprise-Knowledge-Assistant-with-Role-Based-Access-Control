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
      <div className="grid gap-2.5 sm:grid-cols-2">
        {[0, 1].map((card) => (
          <div key={card} className="h-[136px] animate-pulse rounded-2xl bg-secondary/35" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {roles.map((role) => (
        <article
          key={role.key}
          className="rounded-2xl border border-hairline bg-card/55 p-3.5 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl border border-primary/25 bg-primary/[0.10]">
                {role.key === "ADMIN" ? (
                  <ShieldCheck className="size-4 text-primary" />
                ) : (
                  <Users className="size-4 text-primary/85" />
                )}
              </span>
              <div>
                <p className="text-[13px] text-foreground">{role.label}</p>
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {role.key}
                </p>
              </div>
            </div>
            <span className="rounded-lg border border-hairline bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground">
              {role.assignedUsers === null
                ? "Assigned users unavailable"
                : `${role.assignedUsers} users`}
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {role.description}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Capabilities</span>
            <span className="rounded-md border border-hairline bg-secondary/35 px-1.5 py-0.5 text-[11px] text-foreground/85">
              {role.permissions?.length ?? 0}
            </span>
            <span className="ml-1.5 text-[11px] text-muted-foreground">Scopes</span>
            {(role.accessScopes ?? []).map((scope) => (
              <span
                key={scope}
                className="rounded-md border border-hairline bg-secondary/35 px-1.5 py-0.5 text-[11px] capitalize text-foreground/85"
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
    <section className="rounded-2xl border border-hairline bg-card/55 p-3.5 backdrop-blur-xl">
      <header className="flex items-center gap-2">
        <Layers className="size-4 text-primary/85" />
        <h2 className="text-[13px] text-foreground">Knowledge access scopes</h2>
      </header>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        Each document carries an access scope. Together with a member&apos;s role and department it
        will decide what can be retrieved.
      </p>
      <div className="mt-2.5 space-y-2">
        {loading
          ? [0, 1, 2].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-xl bg-secondary/35" />
            ))
          : scopes.map((scope) => {
              const Icon = scopeIcon[scope.key] ?? Globe;
              return (
                <div
                  key={scope.key}
                  className="rounded-xl border border-hairline bg-secondary/25 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[12.5px] text-foreground">
                      <Icon className="size-3.5 text-primary/85" />
                      {scope.label}
                    </p>
                    <span className="text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                      {scope.roles.join(" · ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
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
    <section className="rounded-2xl border border-hairline bg-card/55 p-3.5 backdrop-blur-xl">
      <header className="flex items-center gap-2">
        <Building2 className="size-4 text-primary/85" />
        <h2 className="text-[13px] text-foreground">Departments</h2>
      </header>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        Department is organizational context, kept separate from role. A member can be a User in
        Engineering while another is a User in Finance.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {loading ? (
          <div className="h-8 w-full animate-pulse rounded-xl bg-secondary/35" />
        ) : departments.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No departments available</p>
        ) : (
          departments.map((department) => (
            <span
              key={department.key}
              title={department.description}
              className="rounded-lg border border-hairline bg-secondary/35 px-2 py-1 text-[11.5px] text-foreground/85"
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
    <section className="rounded-2xl border border-hairline bg-card/55 p-3.5 backdrop-blur-xl">
      <header className="flex items-center gap-2">
        <ExternalLink className="size-4 text-primary/85" />
        <h2 className="text-[13px] text-foreground">Where assignments happen</h2>
      </header>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        This page defines what each role can do. Individual assignment and document-level scope live
        on their own surfaces.
      </p>
      <div className="mt-2.5 space-y-1.5">
        <Link
          to="/users"
          className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-secondary/25 px-2.5 py-2 text-[12.5px] text-foreground/90 transition-colors hover:bg-accent/50"
        >
          <span className="flex items-center gap-2">
            <Users className="size-4 text-primary/85" />
            User Management
          </span>
          <span className="text-[11px] text-muted-foreground">Assign role &amp; department</span>
        </Link>
        <Link
          to="/admin/documents"
          className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-secondary/25 px-2.5 py-2 text-[12.5px] text-foreground/90 transition-colors hover:bg-accent/50"
        >
          <span className="flex items-center gap-2">
            <Layers className="size-4 text-primary/85" />
            Document Management
          </span>
          <span className="text-[11px] text-muted-foreground">Set document access scope</span>
        </Link>
      </div>
    </section>
  );
}

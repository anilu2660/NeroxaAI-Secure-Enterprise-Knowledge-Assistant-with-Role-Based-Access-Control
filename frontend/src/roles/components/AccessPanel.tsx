import { Check, Lock, ShieldCheck, Zap } from "lucide-react";
import type { AccessProfile, UserProfile } from "@/api/types";

export function AccessPanel({
  user,
  profile,
}: {
  user: Pick<UserProfile, "name" | "email" | "roleLabel">;
  profile: AccessProfile;
}) {
  return (
    <section className="w-full rounded-3xl border border-primary/20 bg-gradient-to-br from-card/85 via-card/50 to-primary/[0.04] p-5 sm:p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-primary/35">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
        {/* 1. User Identity & Scope Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">Your Access</h2>
              <p className="text-[11px] text-muted-foreground">PostgreSQL &amp; RAG security status</p>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-secondary/30 p-3 shadow-xs">
            <p className="truncate font-display text-[13.5px] font-semibold text-foreground">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
            <div className="mt-2">
              <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary shadow-xs">
                {user.roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Configured Access Scope */}
        <div className="space-y-2.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Configured Access Scope
          </p>
          {profile.scope.length === 0 ? (
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              No access scope assigned to your account yet. An administrator assigns it in User Management.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {profile.scope.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[12px] font-medium transition-all shadow-xs"
                >
                  {item.granted ? (
                    <Check className="size-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={item.granted ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Security Status */}
        <div className="space-y-2.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Security Status
          </p>
          <ul className="space-y-1.5">
            {profile.securityStatus.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[12px] shadow-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {item.granted ? (
                    <Check className="size-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate font-medium text-foreground/90">{item.label}</span>
                </span>
                {!item.granted ? (
                  <span className="shrink-0 rounded-full border border-hairline bg-muted/30 px-2 py-0.5 text-[9.5px] text-muted-foreground">
                    Not connected
                  </span>
                ) : (
                  <span className="size-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Knowledge Access */}
        <div className="space-y-2.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Knowledge Access
          </p>
          <div className="flex items-center gap-2.5 rounded-2xl border border-primary/25 bg-primary/[0.08] p-3 text-[12.5px] font-semibold text-foreground shadow-xs">
            <Zap className="size-4 shrink-0 text-primary" />
            <span className="truncate">{profile.knowledgeAccess}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground/85">
            FastAPI RBAC actively limits vector retrieval to your assigned department &amp; clearance level.
          </p>
        </div>
      </div>
    </section>
  );
}

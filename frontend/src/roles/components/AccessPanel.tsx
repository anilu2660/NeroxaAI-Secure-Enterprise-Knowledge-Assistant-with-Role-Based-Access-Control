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
    <aside className="w-full shrink-0 rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30 xl:w-[260px]">
      <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <ShieldCheck className="size-4.5" />
        </span>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Your Access</h2>
          <p className="text-[11px] text-muted-foreground">PostgreSQL &amp; RAG security status</p>
        </div>
      </div>

      <div className="mt-3.5 rounded-2xl border border-hairline bg-secondary/25 p-3">
        <p className="truncate font-display text-[14px] font-semibold text-foreground">
          {user.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
        <div className="mt-2">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            {user.roleLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-hairline">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Configured Access Scope
        </p>
        {profile.scope.length === 0 ? (
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
            No access scope assigned to your account yet. An administrator assigns it in User Management.
          </p>
        ) : null}
        <ul className="mt-2 space-y-1.5">
          {profile.scope.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 rounded-xl border border-hairline bg-secondary/20 px-3 py-2 text-[12px] font-medium transition-all"
            >
              {item.granted ? (
                <Check className="size-3.5 shrink-0 text-emerald-400" />
              ) : (
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className={item.granted ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-3 border-t border-hairline">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Security Status
        </p>
        <ul className="mt-2 space-y-1.5">
          {profile.securityStatus.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-secondary/20 px-3 py-2 text-[12px]"
            >
              <span className="flex min-w-0 items-center gap-2">
                {item.granted ? (
                  <Check className="size-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-foreground/90 font-medium">{item.label}</span>
              </span>
              {!item.granted ? (
                <span className="shrink-0 rounded-full border border-hairline bg-muted/30 px-2 py-0.5 text-[9.5px] text-muted-foreground">
                  Not connected
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          Real-time system status. All permissions &amp; retrieval pipelines are enforced by FastAPI backend.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-hairline">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Knowledge Access
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.08] px-3 py-2 text-[12px] font-medium text-foreground">
          <Zap className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{profile.knowledgeAccess}</span>
        </div>
      </div>
    </aside>
  );
}

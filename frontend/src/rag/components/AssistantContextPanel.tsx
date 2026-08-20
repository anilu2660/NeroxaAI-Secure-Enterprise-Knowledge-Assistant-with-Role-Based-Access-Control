import { Cpu, Lock, ShieldCheck, User } from "lucide-react";
import type { AssistantCapability } from "@/api/types";
import type { AuthUser } from "@/auth/types";

const icons = {
  rbac: ShieldCheck,
  "secure-retrieval": Lock,
  "local-ai": Cpu,
} as const;

/**
 * Compact contextual panel. Capabilities are listed as product capabilities
 * with their real implementation state — never as active runtime states.
 * Every "Your Context" value comes from the current prototype session.
 */
export function AssistantContextPanel({
  capabilities,
  user,
  accessScope,
}: {
  capabilities: AssistantCapability[];
  user: AuthUser | null;
  accessScope: string;
}) {
  return (
    <aside className="w-full shrink-0 space-y-3 xl:w-[260px]">
      <div className="rounded-3xl border border-hairline bg-card/60 p-4 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
        <p className="pb-2.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase border-b border-hairline">
          Capabilities
        </p>
        <ul className="mt-3 space-y-2">
          {capabilities.map((capability) => {
            const Icon = icons[capability.id];
            const isPositive = ["active", "connected", "enabled", "online"].includes(
              capability.status.toLowerCase(),
            );
            return (
              <li
                key={capability.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-hairline bg-secondary/25 p-2.5 transition-all hover:bg-secondary/40 shadow-xs"
                title={capability.description}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-primary" />
                  <span className="truncate text-[12px] font-medium text-foreground">
                    {capability.title}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                    isPositive
                      ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-400"
                      : "border-rose-500/35 bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {capability.status}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-3xl border border-hairline bg-card/60 p-4 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
        <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
          <span className="grid size-8 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
            <User className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-[13px] font-semibold text-foreground">Your Context</h3>
            <p className="text-[10.5px] text-muted-foreground">Active session parameters</p>
          </div>
        </div>

        <dl className="mt-3 space-y-2.5">
          <div className="rounded-2xl border border-hairline bg-secondary/25 p-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Signed in as
            </dt>
            <dd className="truncate text-[12.5px] font-semibold text-foreground">
              {user?.name ?? "—"}
            </dd>
            <dd className="truncate text-[10.5px] text-muted-foreground">{user?.email ?? ""}</dd>
          </div>

          <div className="flex items-center justify-between gap-2 text-[12px]">
            <dt className="text-muted-foreground">Department</dt>
            <dd className="font-semibold text-foreground">{user?.department ?? "—"}</dd>
          </div>

          <div className="flex items-center justify-between gap-2 text-[12px]">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-semibold text-foreground">{user?.roleLabel ?? "—"}</dd>
          </div>

          <div className="flex flex-col gap-1 text-[12px]">
            <dt className="text-muted-foreground">Access scope</dt>
            <dd className="truncate rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              {accessScope}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

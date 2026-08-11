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
  /** Derived from the session; label stays "Access scope" to avoid over-claiming. */
  accessScope: string;
}) {
  return (
    <aside className="w-full shrink-0 space-y-2.5 xl:w-[248px]">
      <div className="rounded-2xl border border-hairline bg-card/45 p-3 backdrop-blur-xl">
        <p className="pb-2 text-[9.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Capabilities
        </p>
        <ul className="space-y-1.5">
          {capabilities.map((capability) => {
            const Icon = icons[capability.id];
            return (
              <li
                key={capability.id}
                className="flex items-center justify-between gap-2"
                title={capability.description}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[12px] text-foreground/85">
                    {capability.title}
                  </span>
                </span>
                <span className="shrink-0 rounded-md border border-hairline px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                  {capability.status}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-hairline bg-card/45 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full border border-hairline bg-secondary/50">
            <User className="size-3 text-foreground/85" />
          </span>
          <p className="font-display text-[13px] font-medium text-foreground">Your Context</p>
        </div>

        <dl className="mt-2.5 space-y-2">
          <div>
            <dt className="text-[10.5px] text-muted-foreground">Signed in as</dt>
            <dd className="truncate text-[12px] text-foreground">{user?.name ?? "—"}</dd>
            <dd className="truncate text-[10.5px] text-muted-foreground">{user?.email ?? ""}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10.5px] text-muted-foreground">Department</dt>
            <dd className="truncate text-[12px] text-foreground">{user?.department ?? "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10.5px] text-muted-foreground">Role</dt>
            <dd className="truncate text-[12px] text-foreground">{user?.roleLabel ?? "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10.5px] text-muted-foreground">Access scope</dt>
            <dd className="truncate text-[12px] text-foreground">{accessScope}</dd>
          </div>
        </dl>
        <p className="mt-2 border-t border-hairline pt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">
          From your current prototype session — no backend has authorized these values.
        </p>
      </div>
    </aside>
  );
}

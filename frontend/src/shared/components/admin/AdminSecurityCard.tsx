import { ShieldCheck } from "lucide-react";
import type { AdminSecurityContext } from "@/api/types";

/**
 * Administrator security context. It states plainly that the ADMIN role is
 * frontend prototype state and that no backend enforcement or audit logging
 * exists yet.
 */
export function AdminSecurityCard({ context }: { context: AdminSecurityContext | null }) {
  if (!context) return null;

  return (
    <section className="flex items-start gap-3.5 rounded-3xl border border-hairline bg-card/60 p-4 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
        <ShieldCheck className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[13.5px] font-semibold text-foreground">
          {context.title}
        </p>
        <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {context.roleStateLabel}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {context.enforcementLabel}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {context.auditingLabel}
          </li>
        </ul>
      </div>
    </section>
  );
}

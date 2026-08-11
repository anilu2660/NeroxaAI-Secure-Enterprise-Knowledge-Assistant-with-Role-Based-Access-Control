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
    <section className="flex items-start gap-3 rounded-2xl border border-hairline bg-card/60 p-3.5 backdrop-blur-xl">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-hairline bg-secondary/40 text-primary">
        <ShieldCheck className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] text-foreground">{context.title}</p>
        <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground">
          <li>{context.roleStateLabel}</li>
          <li>{context.enforcementLabel}</li>
          <li>{context.auditingLabel}</li>
        </ul>
      </div>
    </section>
  );
}

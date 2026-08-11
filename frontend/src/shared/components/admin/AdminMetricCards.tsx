import { Activity, FileText, Info, UploadCloud, Users } from "lucide-react";
import type { AdminMetric } from "@/api/types";

const ICONS = {
  "total-users": Users,
  "total-documents": FileText,
  "recent-uploads": UploadCloud,
  "recent-activity": Activity,
} as const;

/**
 * Operational overview cards. A null metric value renders "Unavailable" plus
 * the reason — never a fabricated number.
 */
export function AdminMetricCards({ metrics }: { metrics: AdminMetric[] }) {
  if (metrics.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = ICONS[metric.id];
        return (
          <article
            key={metric.id}
            className="rounded-2xl border border-hairline bg-card/60 p-3.5 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-hairline bg-secondary/40 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <span title={metric.hint} className="shrink-0 text-muted-foreground/70">
                    <Info className="size-3.5" />
                    <span className="sr-only">{metric.hint}</span>
                  </span>
                </div>
                <p className="mt-1 truncate font-display text-[19px] font-medium tracking-tight text-foreground">
                  {metric.value ?? "Unavailable"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {metric.value ? metric.hint : metric.unavailableReason}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

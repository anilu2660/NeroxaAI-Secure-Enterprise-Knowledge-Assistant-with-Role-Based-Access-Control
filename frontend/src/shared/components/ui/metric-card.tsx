import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/shared/utils/utils";

export function MetricCard({ label, value, change, trend = "neutral", icon, detail }: {
  label: string;
  value: ReactNode;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  detail?: string;
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-card/75 via-card/50 to-primary/[0.04] p-4 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/85 hover:shadow-lg hover:shadow-primary/10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/15 blur-3xl opacity-0 transition-opacity motion-safe:group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="mt-1.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {detail ? <p className="mt-1 truncate text-[11px] text-muted-foreground/90">{detail}</p> : null}
        </div>
        {icon ? (
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-sm transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
        ) : null}
      </div>
      {change ? (
        <div className={cn("relative mt-3 inline-flex items-center gap-1 text-[11px] font-medium", trend === "up" ? "text-emerald-400" : trend === "down" ? "text-amber-400" : "text-muted-foreground")}>
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {change}
        </div>
      ) : null}
    </article>
  );
}

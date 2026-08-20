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
    <article className="group relative overflow-hidden rounded-[8px] border border-border bg-card p-3.5 sm:p-4 shadow-xs transition-colors hover:border-foreground/20">
      <div className="relative flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[10.5px] font-mono font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {detail ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</p> : null}
        </div>
        {icon ? (
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-[6px] border border-primary/20 bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
      </div>
      {change ? (
        <div className={cn("relative mt-2 inline-flex items-center gap-1 text-[11px] font-medium", trend === "up" ? "text-emerald-500" : trend === "down" ? "text-amber-500" : "text-muted-foreground")}>
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {change}
        </div>
      ) : null}
    </article>
  );
}

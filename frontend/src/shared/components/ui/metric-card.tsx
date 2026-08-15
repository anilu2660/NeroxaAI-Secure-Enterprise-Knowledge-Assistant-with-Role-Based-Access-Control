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
    <article className="group relative overflow-hidden rounded-2xl border border-hairline bg-card/55 p-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card/75 focus-within:border-primary/30">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity motion-safe:group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="mt-2 truncate font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {detail ? <p className="mt-1 truncate text-[10.5px] text-muted-foreground">{detail}</p> : null}
        </div>
        {icon ? <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-xl border border-hairline bg-secondary/60 text-primary">{icon}</span> : null}
      </div>
      {change ? <div className={cn("relative mt-3 inline-flex items-center gap-1 text-[10.5px]", trend === "up" ? "text-emerald-300" : trend === "down" ? "text-amber-300" : "text-muted-foreground")}><TrendIcon className="size-3.5" aria-hidden="true" />{change}</div> : null}
    </article>
  );
}

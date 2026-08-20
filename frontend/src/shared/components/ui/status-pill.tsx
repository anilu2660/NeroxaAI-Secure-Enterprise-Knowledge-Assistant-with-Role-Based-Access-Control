import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

const tones: Record<string, string> = {
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  positive: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  neutral: "border-border bg-secondary/50 text-muted-foreground",
  accent: "border-primary/25 bg-primary/10 text-primary",
};

export function StatusPill({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: "success" | "positive" | "warning" | "danger" | "neutral" | "accent" | (string & {});
  icon?: ReactNode;
  className?: string;
}) {
  const toneClass = tones[tone] ?? tones["neutral"]!;

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium font-mono",
        toneClass,
        className,
      )}
    >
      {icon ? <span aria-hidden="true" className="shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

const tones = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  danger: "border-red-400/20 bg-red-400/10 text-red-300",
  neutral: "border-hairline bg-secondary/50 text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
} as const;

export function StatusPill({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

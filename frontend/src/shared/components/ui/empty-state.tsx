import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card/35 px-6 py-10 text-center backdrop-blur-xl", className)}>
      {icon ? <div className="grid size-10 place-items-center rounded-xl border border-hairline bg-secondary/60 text-muted-foreground">{icon}</div> : null}
      <h2 className="mt-3 font-display text-sm font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-hairline bg-card/50 shadow-sm backdrop-blur-xl", className)}>
      {title || description || action ? (
        <header className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="font-display text-[13px] font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[10.5px] text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div>{children}</div>
    </section>
  );
}

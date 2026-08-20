import { ChevronRight } from "lucide-react";

/**
 * Conceptual resolution chain. Presentational only — it describes the intended
 * architecture and makes no claim that enforcement is active.
 */
export function AccessResolutionChain({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-3xl border border-hairline bg-gradient-to-br from-card/85 via-card/50 to-primary/[0.04] p-5 shadow-lg backdrop-blur-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          RBAC Policy Resolution Chain
        </p>
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-400">
          Evaluated per request
        </span>
      </div>
      <ol className="mt-3.5 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center">
            <span
              className={`flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-[12px] font-semibold shadow-xs transition-all ${
                index === 0 || index === steps.length - 1
                  ? "border-primary/45 bg-primary/15 text-primary ring-1 ring-primary/20"
                  : "border-hairline bg-secondary/40 text-foreground/90"
              }`}
            >
              <span className="grid size-4.5 place-items-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              {step}
            </span>
            {index < steps.length - 1 ? (
              <ChevronRight className="mx-1 size-4 shrink-0 text-primary/60 animate-pulse" />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        A member&apos;s role determines functional permissions, while their department and each
        document&apos;s access scope enforce Qdrant vector-level authorization boundaries.
      </p>
    </div>
  );
}

import { ChevronRight } from "lucide-react";

/**
 * Conceptual resolution chain. Presentational only — it describes the intended
 * architecture and makes no claim that enforcement is active.
 */
export function AccessResolutionChain({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card/55 p-3.5 backdrop-blur-xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        How access is determined
      </p>
      <ol className="mt-2.5 flex flex-wrap items-center gap-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center">
            <span
              className={`rounded-lg border px-2.5 py-1 text-[11.5px] ${
                index === 0 || index === steps.length - 1
                  ? "border-primary/30 bg-primary/[0.10] text-foreground"
                  : "border-hairline bg-secondary/35 text-foreground/85"
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <ChevronRight className="mx-1 size-3.5 shrink-0 text-muted-foreground/70" />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">
        A member&apos;s role decides which capabilities they have, while their department and each
        document&apos;s access scope decide which knowledge can be retrieved for them. This model is
        planned — it is not enforced until the authorization service is connected.
      </p>
    </div>
  );
}

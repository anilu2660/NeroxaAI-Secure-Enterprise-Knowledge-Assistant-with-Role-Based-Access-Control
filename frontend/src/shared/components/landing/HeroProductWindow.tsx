import { ArrowUp, FileText, Lock } from "lucide-react";
import { FEATURE_STATES, type FeatureId } from "@/shared/utils/hero-features";
import { BorderBeam } from "@/shared/components/magicui/border-beam";

/**
 * Single, immutable product-window shell. Geometry, spacing, typography and
 * structure never change between feature states — only content and the
 * supporting background atmosphere behind the window.
 */
export function HeroProductWindow({ feature }: { feature: FeatureId }) {
  const data = FEATURE_STATES[feature];

  return (
    <div className="relative w-full">
      {/* environmental glow behind the window */}
      <div className="pointer-events-none absolute -inset-x-16 -inset-y-12 bg-[radial-gradient(55%_50%_at_50%_50%,oklch(0.75_0.01_264/0.18)_0%,transparent_72%)]" />

      {/* supporting background atmosphere */}
      <div className="absolute -inset-x-6 -inset-y-4 overflow-hidden rounded-2xl">
        {Object.values(FEATURE_STATES).map((state) => (
          <img
            key={state.id}
            src={state.background}
            alt=""
            aria-hidden
            width={1280}
            height={960}
            loading={state.id === "secure" ? "eager" : "lazy"}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
              state.id === feature ? "opacity-70" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--background),transparent_75%)]" />
      </div>

      {/* metallic outer frame */}
      <div className="relative m-3 rounded-[18px] bg-gradient-to-br from-white/20 via-white/5 to-white/10 p-px shadow-2xl">
        {/* product window — identical in every state */}
        <div className="relative overflow-hidden rounded-[17px] border border-hairline/80 bg-card/90 shadow-2xl backdrop-blur-2xl">
          <BorderBeam size={320} duration={12} delay={0} colorFrom="#3b82f6" colorTo="#a855f7" />
          {/* soft environmental reflection across the glass */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,oklch(1_0_0/0.09)_0%,transparent_30%,transparent_78%,oklch(1_0_0/0.05)_100%)]" />
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(to_right,transparent,oklch(1_0_0/0.5),transparent)]" />

          {/* window chrome */}
          <div className="flex items-center gap-3 border-b border-hairline/70 bg-secondary/20 px-3.5 py-2.5">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-500/70" />
              <span className="size-2.5 rounded-full bg-amber-500/70" />
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
            </span>
            <span className="rounded-md border border-hairline/60 bg-secondary/40 px-3 py-0.5 text-[10.5px] font-medium text-foreground/85 shadow-xs">
              Ask NeroxaAI
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[9.5px] tracking-wide text-muted-foreground uppercase font-semibold">
              Illustrative preview
              <Lock className="size-3 text-emerald-400" />
            </span>
          </div>

          <div key={feature} className="animate-in fade-in-0 space-y-3 p-4 duration-500">
            {/* user query */}
            <div className="rounded-xl border border-primary/25 bg-primary/[0.08] px-3.5 py-2.5 text-[12px] font-medium text-foreground">
              {data.query}
            </div>

            {/* main result + status badge */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] font-medium text-foreground">{data.resultTitle}</p>
              <span className="shrink-0 rounded-full border border-hairline px-2 py-0.5 text-[9px] tracking-wide text-foreground/70">
                {data.badge}
              </span>
            </div>

            {/* meta rows */}
            {data.metaRows ? (
              <div className="grid grid-cols-3 gap-2">
                {data.metaRows.map((row) => (
                  <div key={row.label} className="rounded-md border border-hairline px-2 py-1.5">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-[11px] text-foreground/90">{row.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* document / result rows */}
            <div className="space-y-1.5">
              <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                {data.listTitle}
              </p>
              {data.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-md border border-hairline px-2.5 py-1.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[11px] text-foreground/90">{row.label}</span>
                  </span>
                  <span
                    className={`shrink-0 text-[9.5px] tracking-wide ${
                      row.state === "allowed"
                        ? "text-allowed"
                        : row.state === "blocked"
                          ? "text-blocked"
                          : "text-muted-foreground"
                    }`}
                  >
                    {row.meta}
                  </span>
                </div>
              ))}
            </div>

            {/* AI response */}
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">{data.responseTitle}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {data.responseBody}
              </p>
            </div>

            {/* supporting tags */}
            {data.tags?.length ? (
              <div className="space-y-1.5">
                <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                  {data.tagsTitle}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-hairline px-2 py-0.5 text-[10px] text-foreground/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* status */}
            <p className="text-[10px] text-muted-foreground">{data.status}</p>

            {/* bottom input */}
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-card/60 px-3 py-2">
              <span className="flex-1 text-[11px] text-muted-foreground">
                {data.inputPlaceholder}
              </span>
              <span className="flex size-6 items-center justify-center rounded-md border border-hairline">
                <ArrowUp className="size-3 text-foreground/80" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

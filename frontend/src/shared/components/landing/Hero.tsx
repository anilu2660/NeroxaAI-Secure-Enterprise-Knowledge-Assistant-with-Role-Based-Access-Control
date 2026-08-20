import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Zap, FileText } from "lucide-react";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-8 pb-10 sm:pt-14 sm:pb-14 text-center">
      {/* Subtle Atmospheric Ambient Glow behind Hero */}
      <div className="pointer-events-none absolute -top-28 left-1/2 -z-10 -translate-x-1/2 size-[320px] sm:size-[560px] rounded-full bg-primary/[0.05] dark:bg-primary/[0.08] blur-[100px] sm:blur-[120px]" />

      {/* Slim Hairline Trust Badge */}
      <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 rounded-full border border-border/80 bg-secondary/40 px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-[11px] font-mono text-muted-foreground shadow-2xs backdrop-blur-sm">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-foreground truncate">Nexora AI v2.4</span>
        <span className="opacity-40">/</span>
        <span className="truncate">RBAC &amp; Local RAG</span>
      </div>

      {/* Main Headline with Linear-grade gradient accent */}
      <h1 className="mt-5 sm:mt-6 font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.14] sm:leading-[1.12]">
        Talk to your company knowledge.
        <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent mt-1">
          With zero data leaks.
        </span>
      </h1>

      {/* High-contrast Subtitle */}
      <p className="mt-4 sm:mt-5 text-[14px] sm:text-[16px] leading-relaxed text-muted-foreground max-w-2xl mx-auto font-normal px-1">
        Instant, grounded citations from your internal documents and repositories. Strictly filtered at query-time by employee role permissions and executed entirely on private local AI.
      </p>

      {/* Primary Actions with Micro-beveled finish */}
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 max-w-xs sm:max-w-none mx-auto">
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="inline-flex h-10.5 sm:h-10 items-center justify-center gap-2 rounded-[6px] bg-primary px-6 text-[13px] font-semibold sm:font-medium text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.15)] border border-primary/40 transition-all hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
        >
          Launch Workspace
          <ArrowRight className="size-4" />
        </button>

        <a
          href="#architecture"
          className="inline-flex h-10.5 sm:h-10 items-center justify-center rounded-[6px] border border-border bg-secondary/30 px-5 text-[13px] font-medium text-foreground hover:bg-secondary/70 hover:border-foreground/20 transition-all active:scale-[0.98]"
        >
          Inspect Architecture
        </a>
      </div>

      {/* Refined Unified Monochrome Trust Signals */}
      <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8 border-t border-border/60 pt-5 sm:pt-6 text-[11px] sm:text-[11.5px] text-muted-foreground font-mono">
        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <Lock className="size-3.5 shrink-0 text-muted-foreground/80" />
          <span>100% Air-Gapped</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground/80" />
          <span>Query-Time RBAC</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <FileText className="size-3.5 shrink-0 text-muted-foreground/80" />
          <span>Verified Citations</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <Zap className="size-3.5 shrink-0 text-muted-foreground/80" />
          <span>&lt; 180ms Latency</span>
        </div>
      </div>
    </section>
  );
}

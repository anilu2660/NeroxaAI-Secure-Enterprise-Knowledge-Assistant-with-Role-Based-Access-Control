import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Zap, FileText } from "lucide-react";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-6 pt-12 pb-14 sm:pt-16 sm:pb-16 text-center">
      {/* Trust pill */}
      <div className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-secondary/50 px-3 py-1 text-[12px] font-medium text-foreground/80">
        <span className="inline-block size-2 rounded-full bg-emerald-500" />
        <span className="font-semibold text-foreground">NeroxaAI Enterprise</span>
        <span className="text-muted-foreground">·</span>
        <span>Deterministic RBAC &amp; Local RAG</span>
      </div>

      {/* Main Headline */}
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.12]">
        Talk to your company knowledge.
        <span className="block text-primary">With zero data leaks.</span>
      </h1>

      {/* High-contrast Subtitle */}
      <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground max-w-2xl mx-auto font-normal">
        Instant, cited answers from your internal PDFs, policies, and documents. Strictly isolated by employee permissions and executed on private local AI.
      </p>

      {/* Primary Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Launch Workspace
          <ArrowRight className="size-4" />
        </button>

        <a
          href="#architecture"
          className="inline-flex h-10 items-center justify-center rounded-[6px] border border-border bg-secondary/30 px-5 text-[13px] font-medium text-foreground/90 transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          Inspect Architecture
        </a>
      </div>

      {/* Minimal Enterprise Trust Signals */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 border-t border-hairline/60 pt-6 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-foreground/70" />
          <span>100% Air-Gapped Local Inference</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-foreground/70" />
          <span>Deterministic Query-Time RBAC</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 text-foreground/70" />
          <span>Verifiable Multi-Page Citations</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 text-foreground/70" />
          <span>&lt; 180ms Median Retrieval</span>
        </div>
      </div>
    </section>
  );
}

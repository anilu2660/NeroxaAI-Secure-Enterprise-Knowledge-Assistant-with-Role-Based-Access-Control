import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Zap, FileText } from "lucide-react";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-10 pb-10 sm:pt-16 sm:pb-14 text-center">
      {/* Clean Single Trust Badge */}
      <div className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-secondary/50 px-3 py-1 text-[11px] font-mono text-muted-foreground">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span className="font-semibold text-foreground">Nexora AI</span>
        <span className="opacity-40">/</span>
        <span>Deterministic Access-Controlled RAG</span>
      </div>

      {/* Main Headline - High Contrast, Clear Hierarchy */}
      <h1 className="mt-5 sm:mt-6 font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
        Instant answers from company knowledge.
        <span className="block text-primary mt-1">
          Zero data leaks across departments.
        </span>
      </h1>

      {/* Benefit-Focused Subtitle */}
      <p className="mt-4 sm:mt-5 text-[14.5px] sm:text-[16px] leading-relaxed text-muted-foreground max-w-2xl mx-auto font-normal px-1">
        Search internal policies, codebases, and compliance records with exact page citations. Deterministic query-time access control ensures confidential payroll, legal, and executive documents never surface to unauthorized staff.
      </p>

      {/* Primary Actions */}
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 max-w-xs sm:max-w-none mx-auto">
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-primary px-6 text-[13px] font-medium text-primary-foreground border border-primary/40 transition-colors hover:bg-primary/90 cursor-pointer"
        >
          Launch Workspace
          <ArrowRight className="size-4" />
        </button>

        <a
          href="#architecture"
          className="inline-flex h-10 items-center justify-center rounded-[6px] border border-border bg-card px-5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Inspect Architecture Pipeline
        </a>
      </div>

      {/* Concrete Security & Performance Proof Signals */}
      <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8 border-t border-border/80 pt-6 text-[11.5px] text-muted-foreground font-mono">
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <Lock className="size-3.5 shrink-0 text-foreground/70" />
          <span>100% Air-Gapped Local Inference</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0 text-foreground/70" />
          <span>Deterministic Query-Time RBAC</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <FileText className="size-3.5 shrink-0 text-foreground/70" />
          <span>Verifiable Multi-Page Citations</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <Zap className="size-3.5 shrink-0 text-foreground/70" />
          <span>&lt; 180ms Median Retrieval</span>
        </div>
      </div>
    </section>
  );
}

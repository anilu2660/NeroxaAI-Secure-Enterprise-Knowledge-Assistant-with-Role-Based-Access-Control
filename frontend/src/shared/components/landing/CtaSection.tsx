import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Zap } from "lucide-react";

export function CtaSection() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-6 py-16">
      <div className="rounded-[10px] border border-border bg-card p-8 sm:p-12 text-center shadow-sm">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 rounded-[6px] border border-border bg-secondary/50 px-3 py-1 text-[12px] font-medium text-foreground/80">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            <span>Ready for Production Deployment</span>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Empower your organization with grounded, private AI.
          </h2>

          <p className="text-[14.5px] leading-relaxed text-muted-foreground">
            Experience sub-second hybrid document search, verifiable page citations, and deterministic role-based security across your internal documents.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-primary px-6 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Launch Workspace
              <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="inline-flex h-10 items-center justify-center rounded-[6px] border border-border bg-secondary/30 px-5 text-[13px] font-medium text-foreground/90 transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              Sign In to Your Account
            </button>
          </div>

          <div className="pt-6 border-t border-hairline/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-foreground/70" />
              <span>SOC2 Ready Architecture</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-foreground/70" />
              <span>100% On-Premise Vector Privacy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-foreground/70" />
              <span>Instant Local Ollama Setup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

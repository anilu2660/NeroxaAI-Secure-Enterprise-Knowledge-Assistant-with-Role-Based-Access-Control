import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { ShimmerButton } from "@/shared/components/magicui/shimmer-button";
import { BorderBeam } from "@/shared/components/magicui/border-beam";

export function CtaSection() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-16 lg:py-24">
      <div className="relative overflow-hidden rounded-4xl border border-primary/30 bg-gradient-to-br from-card/95 via-primary/[0.08] to-card/90 p-8 sm:p-14 text-center shadow-2xl backdrop-blur-2xl">
        <BorderBeam size={340} duration={14} delay={0} colorFrom="#3b82f6" colorTo="#a855f7" />

        {/* Glowing radial aura */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
            <Sparkles className="size-3.5" />
            <span>Ready for Production Deployment</span>
          </div>

          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Empower Your Organization with Grounded, Private AI.
          </h2>

          <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
            Experience sub-second hybrid document search, verifiable citations, and deterministic role-based security across your enterprise.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <ShimmerButton
              shimmerColor="#60a5fa"
              background="rgba(37, 99, 235, 0.95)"
              className="h-12 px-8 text-[14px] font-semibold text-white shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate({ to: "/login" })}
            >
              Launch Workspace
              <ArrowUpRight className="size-4 ml-2" />
            </ShimmerButton>

            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="h-12 rounded-full border border-hairline/80 bg-secondary/40 px-6 text-[13.5px] font-semibold text-foreground transition-all hover:bg-secondary/70 hover:border-primary/40"
            >
              Sign In to Your Account
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              SOC2 Ready Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-primary" />
              Instant Setup with Local Ollama
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-purple-400" />
              100% On-Premise Vectors
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

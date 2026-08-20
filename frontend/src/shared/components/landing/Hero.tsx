import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, ShieldCheck, Lock, Zap, Search } from "lucide-react";
import { HeroProductWindow } from "./HeroProductWindow";
import { HeroFeaturePills } from "./HeroFeaturePills";
import type { FeatureId } from "@/shared/utils/hero-features";
import { ShimmerButton } from "@/shared/components/magicui/shimmer-button";
import { Particles } from "@/shared/components/magicui/particles";

export function Hero() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureId>("secure");
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:pb-28 lg:pt-16">
      {/* Ambient floating particles */}
      <Particles quantity={28} staticity={30} ease={50} color="99, 102, 241" className="opacity-60" />

      {/* Environmental Spotlight Glow */}
      <div className="pointer-events-none absolute -left-20 top-12 size-96 rounded-full bg-primary/15 blur-[120px]" />

      <div className="relative z-10 max-w-2xl space-y-6">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-md transition-all hover:border-primary/50">
          <Sparkles className="size-3.5 animate-pulse" />
          <span>Enterprise Knowledge Assistant</span>
          <span className="h-3 w-px bg-primary/30" />
          <span className="font-medium text-foreground/80">RBAC Verified</span>
        </div>

        {/* Large Gradient Headline — Punchy & Human */}
        <h1 className="font-display text-[2.75rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.85rem]">
          Talk to your company knowledge.
          <span className="block mt-1 bg-gradient-to-r from-primary via-purple-500 to-indigo-400 bg-clip-text text-transparent">
            With zero data leaks.
          </span>
        </h1>

        {/* High-Contrast Human Subtitle */}
        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-xl">
          Instant, cited answers from your internal PDFs, policies, and documents. Strictly limited by employee permissions and powered by private local AI.
        </p>

        {/* CTA Buttons & Interactive Prompt Bar */}
        <div className="pt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ShimmerButton
            shimmerColor="#60a5fa"
            background="rgba(37, 99, 235, 0.95)"
            className="h-12 px-7 text-[14px] font-semibold text-white shadow-xl hover:scale-105 transition-transform"
            onClick={() => navigate({ to: "/login" })}
          >
            Launch Workspace
            <ArrowUpRight className="size-4 ml-2" />
          </ShimmerButton>

          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="group flex items-center gap-3 rounded-full border border-hairline/80 bg-secondary/40 py-2 pl-2 pr-5 text-left backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-secondary/70 shadow-xs"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/15 font-mono text-[11px] text-primary group-hover:scale-110 transition-transform">
              <Search className="size-3.5" />
            </span>
            <span className="font-mono text-[13px] text-foreground/80 group-hover:text-foreground transition-colors">
              Search internal documents...
            </span>
          </button>
        </div>

        {/* Proof Badges */}
        <div className="pt-4 border-t border-hairline/60 flex flex-wrap items-center gap-5 text-[12px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-4 text-emerald-400" />
            Air-Gapped Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            Role-Based Access
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="size-4 text-amber-400" />
            &lt; 180ms Latency
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <HeroProductWindow feature={selectedFeature} />
        <div className="relative z-10 -mt-4 flex justify-center lg:-mt-5">
          <HeroFeaturePills selected={selectedFeature} onSelect={setSelectedFeature} />
        </div>
      </div>
    </section>
  );
}

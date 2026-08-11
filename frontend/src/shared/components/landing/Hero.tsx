import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { HeroProductWindow } from "./HeroProductWindow";
import { HeroFeaturePills } from "./HeroFeaturePills";
import type { FeatureId } from "@/shared/utils/hero-features";
import { ShimmerButton } from "@/shared/components/magicui/shimmer-button";

export function Hero() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureId>("secure");
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:pb-28 lg:pt-24">
      <div className="max-w-xl">
        <h1 className="font-display text-[2.6rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
          Secure Enterprise AI Built Around Your Organization&rsquo;s Knowledge.
        </h1>
        <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
          NeroxaAI enables organizations to securely search, retrieve internal knowledge using
          Retrieval-Augmented Generation (RAG), Role-Based Access Control (RBAC), and Local AI
          models.
        </p>

        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ShimmerButton
            shimmerColor="#60a5fa"
            background="rgba(30, 58, 138, 0.9)"
            className="h-11 px-6 text-[14px] font-semibold text-white shadow-xl"
            onClick={() => navigate({ to: "/login" })}
          >
            Ask NeroxaAI
            <ArrowUpRight className="size-4 ml-2" />
          </ShimmerButton>

          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface-strong py-1.5 pl-1.5 pr-5 backdrop-blur-xl">
            <span className="flex size-8 items-center justify-center rounded-full border border-hairline bg-card/70 font-mono text-[11px] text-foreground/90">
              &gt;_
            </span>
            <span className="font-mono text-[13px] text-foreground/75">
              Search company documents...
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <HeroProductWindow feature={selectedFeature} />
        <div className="relative z-10 -mt-4 flex justify-center lg:-mt-5">
          <HeroFeaturePills selected={selectedFeature} onSelect={setSelectedFeature} />
        </div>
      </div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/shared/components/landing/Navbar";
import { Hero } from "@/shared/components/landing/Hero";
import { HeroProductWindow } from "@/shared/components/landing/HeroProductWindow";
import { CoreBenefits } from "@/shared/components/landing/CoreBenefits";
import { SecuritySection } from "@/shared/components/landing/SecuritySection";
import { HowItWorks } from "@/shared/components/landing/HowItWorks";
import { ArchitectureSimulation } from "@/shared/components/landing/ArchitectureSimulation";
import { MetricsSection } from "@/shared/components/landing/MetricsSection";
import { CtaSection } from "@/shared/components/landing/CtaSection";
import { Footer } from "@/shared/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeroxaAI — Secure Enterprise AI for Internal Knowledge" },
      {
        name: "description",
        content:
          "NeroxaAI lets organizations securely search and retrieve internal knowledge using RAG, Role-Based Access Control, and air-gapped local AI models.",
      },
      { property: "og:title", content: "NeroxaAI — Secure Enterprise AI" },
      {
        property: "og:description",
        content:
          "Securely search internal knowledge with RAG, RBAC, and local AI models built around your organization.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-svh bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      <Navbar />
      <main>
        {/* 1. Hero */}
        <Hero />

        {/* 2. Product Demonstration */}
        <HeroProductWindow />

        {/* 3. Three Core Benefits */}
        <CoreBenefits />

        {/* 4. Security & Zero-Trust Blueprint */}
        <SecuritySection />

        {/* 5. How It Works Pipeline */}
        <HowItWorks />

        {/* 6. System Architecture Simulation */}
        <ArchitectureSimulation />

        {/* 7. Proof / Empirical Metrics */}
        <MetricsSection />

        {/* 8. Call to Action */}
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

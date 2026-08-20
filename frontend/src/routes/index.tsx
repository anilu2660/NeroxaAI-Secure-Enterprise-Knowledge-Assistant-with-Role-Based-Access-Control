import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/shared/components/landing/Navbar";
import { Hero } from "@/shared/components/landing/Hero";
import { StatsBar } from "@/shared/components/landing/StatsBar";
import { BentoGrid } from "@/shared/components/landing/BentoGrid";
import { HowItWorks } from "@/shared/components/landing/HowItWorks";
import { SecuritySection } from "@/shared/components/landing/SecuritySection";
import { FaqSection } from "@/shared/components/landing/FaqSection";
import { CtaSection } from "@/shared/components/landing/CtaSection";
import { Footer } from "@/shared/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeroxaAI — Secure Enterprise AI for Internal Knowledge" },
      {
        name: "description",
        content:
          "NeroxaAI lets organizations securely search and retrieve internal knowledge using RAG, Role-Based Access Control, and local AI models.",
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
      {/* Dynamic atmospheric radial lighting & mesh aura */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.65_0.18_260/0.12),transparent)]" />
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 size-[500px] rounded-full bg-purple-500/10 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-10 -left-40 size-[500px] rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <StatsBar />
          <BentoGrid />
          <HowItWorks />
          <SecuritySection />
          <FaqSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}

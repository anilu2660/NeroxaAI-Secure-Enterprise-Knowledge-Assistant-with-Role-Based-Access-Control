import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/shared/components/landing/Navbar";
import { Hero } from "@/shared/components/landing/Hero";

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
    <div
      className="relative min-h-svh overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/BGimage.png')" }}
    >
      <div className="relative">
        <Navbar />
        <Hero />
      </div>
    </div>
  );
}

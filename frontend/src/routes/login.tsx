import { createFileRoute } from "@tanstack/react-router";
import { ModernLoginSignup } from "@/shared/components/ui/modern-login-signup";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in to NeroxaAI — Secure AI Workspace" },
      {
        name: "description",
        content:
          "Sign in or create a NeroxaAI account to access your secure enterprise AI workspace with RBAC-protected knowledge retrieval.",
      },
      { property: "og:title", content: "Sign in to NeroxaAI" },
      {
        property: "og:description",
        content: "Access your secure NeroxaAI enterprise AI workspace.",
      },
    ],
  }),
  component: ModernLoginSignup,
});

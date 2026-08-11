import AnimatedGradientBackground from "@/shared/components/ui/animated-gradient-background";

/**
 * SHARED AUTHENTICATED BACKGROUND — the single source of truth for the
 * atmospheric dark-to-blue environment behind every signed-in NeroxaAI surface
 * (Account, Dashboard, Assistant, Documents, and all admin pages).
 *
 * The values below are exactly the treatment the Account page established:
 * breathing radial gradient anchored high (50% 20%) so the lighting falls from
 * the top, near-black base deepening into workspace blue, low animation speed
 * so it never competes with the UI. Change it here only — never per route, or
 * pages drift into different environments again.
 */
const WORKSPACE_GRADIENT_COLORS = [
  "#08090E",
  "#0B1224",
  "#0E2148",
  "#143066",
  "#173672",
  "#1B4090",
  "#1F4CAC",
];

const WORKSPACE_GRADIENT_STOPS = [12, 25, 42, 58, 73, 88, 100];

export function WorkspaceBackground() {
  return (
    <AnimatedGradientBackground
      Breathing
      startingGap={65}
      breathingRange={15}
      animationSpeed={0.05}
      topOffset={0}
      gradientColors={WORKSPACE_GRADIENT_COLORS}
      gradientStops={WORKSPACE_GRADIENT_STOPS}
    />
  );
}

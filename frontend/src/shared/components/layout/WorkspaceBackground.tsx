import AnimatedGradientBackground from "@/shared/components/ui/animated-gradient-background";
import { useTheme } from "@/shared/components/ui/ThemeToggle";

const DARK_GRADIENT_COLORS = [
  "#08090E",
  "#0B1224",
  "#0E2148",
  "#143066",
  "#173672",
  "#1B4090",
  "#1F4CAC",
];

const SUNNY_GRADIENT_COLORS = [
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#E2E8F0",
  "#CBD5E1",
  "#E2E8F0",
  "#F8FAFC",
];

const WORKSPACE_GRADIENT_STOPS = [12, 25, 42, 58, 73, 88, 100];

export function WorkspaceBackground() {
  const { isSunny } = useTheme();

  return (
    <AnimatedGradientBackground
      key={isSunny ? "sunny-bg" : "dark-bg"}
      Breathing
      startingGap={65}
      breathingRange={15}
      animationSpeed={0.04}
      topOffset={0}
      gradientColors={isSunny ? SUNNY_GRADIENT_COLORS : DARK_GRADIENT_COLORS}
      gradientStops={WORKSPACE_GRADIENT_STOPS}
    />
  );
}

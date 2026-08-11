/**
 * Cinematic hero environment: a photographic 3D perspective grid floor image
 * plus restrained atmospheric lighting. No JS loop, no layout cost.
 */
import gridBg from "@/assets/hero-grid-bg.png.asset.json";

export function AnimatedGridBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-background" />

      {/* perspective grid environment */}
      <img
        src={gridBg.url}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />

      {/* environmental lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(58%_52%_at_70%_42%,oklch(0.72_0.01_264/0.14)_0%,transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,oklch(0.6_0.01_264/0.06)_0%,transparent_65%)]" />

      {/* edge vignette to protect readability */}
      <div className="absolute inset-0 bg-[radial-gradient(135%_105%_at_52%_40%,transparent_72%,var(--background)_100%)]" />
    </div>
  );
}

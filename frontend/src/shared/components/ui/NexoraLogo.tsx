import React from "react";
import { cn } from "@/shared/utils/utils";

interface NexoraLogoProps {
  className?: string;
  size?: number | string;
  animated?: boolean;
  withGlow?: boolean;
  variant?: "badge" | "plain" | "floating";
}

/**
 * Nexora "N" Emblem with security shield lock badge.
 * Modeled directly after the official Nexora AI brand mark.
 */
export function NexoraLogo({
  className,
  size,
  animated = false,
  withGlow = false,
  variant = "plain",
}: NexoraLogoProps) {
  const pixelSize = size !== undefined ? (typeof size === "number" ? `${size}px` : size) : undefined;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center select-none shrink-0 group",
        variant === "floating" && animated && "animate-[bounce_4s_ease-in-out_infinite]",
        !size && "size-6",
        className,
      )}
      style={pixelSize ? { width: pixelSize, height: pixelSize } : undefined}
    >
      {/* Dynamic Ambient Aura / Radial Glow */}
      {withGlow && (
        <div
          className={cn(
            "pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-tr from-primary/30 via-blue-500/20 to-indigo-500/30 blur-xl transition-all duration-700",
            animated && "animate-pulse group-hover:bg-primary/50 group-hover:blur-2xl",
          )}
        />
      )}

      {/* Main SVG Graphic */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "relative z-10 block max-h-full max-w-full drop-shadow-xs transition-all duration-300",
          animated && "group-hover:scale-105 group-hover:-translate-y-0.5",
        )}
      >
        <defs>
          {/* Left Vertical Pillar Gradient */}
          <linearGradient id="nexora-grad-left" x1="15" y1="15" x2="35" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          {/* Diagonal Central Slash Gradient */}
          <linearGradient id="nexora-grad-diagonal" x1="15" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="30%" stopColor="#2563eb" />
            <stop offset="70%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          {/* Right Pillar Gradient */}
          <linearGradient id="nexora-grad-right" x1="75" y1="45" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          {/* Shield Badge Gradient */}
          <linearGradient id="nexora-shield-grad" x1="68" y1="12" x2="98" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Shield Stroke Gradient */}
          <linearGradient id="nexora-shield-stroke" x1="68" y1="12" x2="98" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* 1. Left Vertical Element / Triangle Cut */}
        <path
          d="M16 20L38 42V98L16 104V20Z"
          fill="url(#nexora-grad-left)"
        />

        {/* 2. Main Diagonal Slash (Primary 'N' Crossbar) */}
        <path
          d="M16 16L102 104H78L16 42V16Z"
          fill="url(#nexora-grad-diagonal)"
        />

        {/* 3. Right Vertical Pillar */}
        <path
          d="M80 48L102 70V104L80 82V48Z"
          fill="url(#nexora-grad-right)"
        />

        {/* Top diagonal highlight line */}
        <path
          d="M16 16L102 104"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 4. Top-Right Security Shield & Lock Badge */}
        <g className={animated ? "transition-transform duration-300 group-hover:scale-110 origin-[84px_28px]" : ""}>
          {/* Shield Base */}
          <path
            d="M84 8C84 8 94 11 104 8V27C104 38 94 48 84 52C74 48 64 38 64 27V8C74 11 84 8 84 8Z"
            fill="url(#nexora-shield-grad)"
            stroke="url(#nexora-shield-stroke)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Shield Inner Light */}
          <path
            d="M84 11C84 11 92 13.5 100 11V26C100 34 92 43 84 47C76 43 68 34 68 26V11C76 13.5 84 11 84 11Z"
            fill="rgba(37, 99, 235, 0.25)"
          />

          {/* Padlock Shackle */}
          <path
            d="M80 23V20C80 17.7909 81.7909 16 84 16C86.2091 16 88 17.7909 88 20V23"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Padlock Body */}
          <rect
            x="76"
            y="23"
            width="16"
            height="13"
            rx="3"
            fill="#ffffff"
          />

          {/* Padlock Keyhole */}
          <circle cx="84" cy="28.5" r="1.5" fill="#0f172a" />
          <path
            d="M84 30V33"
            stroke="#0f172a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

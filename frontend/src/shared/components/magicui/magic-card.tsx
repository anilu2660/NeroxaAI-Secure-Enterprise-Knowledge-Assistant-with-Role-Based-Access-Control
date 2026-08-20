import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/shared/utils/utils";

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  children: React.ReactNode;
}

export function MagicCard({
  children,
  className,
  gradientSize = 250,
  gradientColor = "oklch(0.65 0.2 260 / 0.15)",
  gradientOpacity = 0.8,
  ...props
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const { left, top } = cardRef.current.getBoundingClientRect();
      const clientX = e.clientX - left;
      const clientY = e.clientY - top;

      cardRef.current.style.setProperty("--mouse-x", `${clientX}px`);
      cardRef.current.style.setProperty("--mouse-y", `${clientY}px`);
      cardRef.current.style.setProperty("--gradient-size", `${gradientSize}px`);
      cardRef.current.style.setProperty("--gradient-color", gradientColor);
      cardRef.current.style.setProperty("--gradient-opacity", `${gradientOpacity}`);
    },
    [gradientSize, gradientColor, gradientOpacity],
  );

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-hairline/80 bg-card/75 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(var(--gradient-size, 250px) circle at var(--mouse-x, 0px) var(--mouse-y, 0px), var(--gradient-color, oklch(0.65 0.2 260 / 0.15)), transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

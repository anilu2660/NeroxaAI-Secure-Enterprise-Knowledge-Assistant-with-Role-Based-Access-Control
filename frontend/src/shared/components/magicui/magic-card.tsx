import React, { useCallback, useRef } from "react";
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
  gradientSize = 200,
  gradientColor = "rgba(37, 99, 235, 0.08)",
  gradientOpacity = 0.6,
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
        "group relative overflow-hidden rounded-[10px] border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(var(--gradient-size, 200px) circle at var(--mouse-x, 0px) var(--mouse-y, 0px), var(--gradient-color, rgba(37, 99, 235, 0.08)), transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

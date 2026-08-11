import * as React from "react";
import { cn } from "@/shared/utils/utils";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.08em",
      shimmerDuration = "3s",
      borderRadius = "12px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-5 py-2.5 text-foreground [background:var(--bg)] [border-radius:var(--radius)] transition-transform duration-300 active:scale-95",
          "transform-gpu shadow-xl hover:shadow-2xl",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer highlights */}
        <div
          className={cn(
            "-z-30 absolute inset-0 overflow-visible [container-type:size]",
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread,90deg)/2)),transparent_0,var(--shimmer-color)_calc(var(--spread,90deg)/2),transparent_var(--spread,90deg))] [translate:0_0]" />
          </div>
        </div>
        {children}

        {/* Highlight ring */}
        <div
          className={cn(
            "insert-0 absolute size-full rounded-[inherit] px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 ring-inset hover:ring-white/40 transition-all",
          )}
        />

        {/* backdrop */}
        <div
          className={cn(
            "absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]",
          )}
        />
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";

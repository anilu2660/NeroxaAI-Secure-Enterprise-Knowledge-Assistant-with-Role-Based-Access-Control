import { FileText, Lock, Search, ShieldCheck } from "lucide-react";
import { FEATURE_ORDER, FEATURE_STATES, type FeatureId } from "@/shared/utils/hero-features";

const ICONS: Record<FeatureId, typeof ShieldCheck> = {
  secure: ShieldCheck,
  rbac: Lock,
  semantic: Search,
  citations: FileText,
};

export function HeroFeaturePills({
  selected,
  onSelect,
}: {
  selected: FeatureId;
  onSelect: (id: FeatureId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Product capabilities"
      className="flex max-w-full items-center justify-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]"
    >
      {FEATURE_ORDER.map((id) => {
        const Icon = ICONS[id];
        const active = id === selected;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            className={`flex items-center gap-2 shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-medium backdrop-blur transition-colors duration-300 ${
              active
                ? "border-border bg-primary text-primary-foreground"
                : "border-hairline bg-surface-strong text-foreground/80 hover:bg-accent"
            }`}
          >
            <Icon className="size-3.5" />
            {FEATURE_STATES[id].pill}
          </button>
        );
      })}
    </div>
  );
}

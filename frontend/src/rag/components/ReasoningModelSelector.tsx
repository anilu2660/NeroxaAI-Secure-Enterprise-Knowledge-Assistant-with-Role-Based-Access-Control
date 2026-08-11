import { useEffect, useRef, useState } from "react";
import { ChevronDown, Cloud, Cpu, Info } from "lucide-react";
import type { ReasoningModelOption } from "@/api/types";
import { noModelConfiguredLabel } from "@/rag/mock/reasoning-models";

/**
 * Reasoning-provider switcher. Providers that are not connected cannot be
 * selected — the trigger then honestly reads "No model configured".
 */
export function ReasoningModelSelector({
  models,
  selectedId,
  onSelect,
}: {
  models: ReasoningModelOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = models.find((model) => model.id === selectedId && model.available) ?? null;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const groups: { key: "local" | "cloud"; label: string }[] = [
    { key: "local", label: "Local" },
    { key: "cloud", label: "Cloud" },
  ];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-hairline bg-card/60 px-2.5 py-1.5 text-left backdrop-blur-xl transition-colors hover:bg-accent/50"
      >
        <span className="grid size-6 place-items-center rounded-lg border border-hairline bg-secondary/50">
          {selected?.tier === "cloud" ? (
            <Cloud className="size-3 text-muted-foreground" />
          ) : (
            <Cpu className="size-3 text-muted-foreground" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] leading-none text-muted-foreground">
            Reasoning model
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-foreground">
            {selected?.shortLabel ?? noModelConfiguredLabel}
          </span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Reasoning model"
          className="animate-in fade-in-0 slide-in-from-top-1 absolute right-0 z-50 mt-2 w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border border-hairline bg-surface-strong p-1.5 shadow-menu backdrop-blur-xl duration-150"
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] leading-relaxed text-muted-foreground">
            Planned providers for a future integration. None is connected in this build.
          </p>
          {groups.map((group) => {
            const items = models.filter((model) => model.tier === group.key);
            if (!items.length) return null;
            return (
              <div key={group.key} className="pb-1">
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {group.label}
                </p>
                {items.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={model.id === selectedId && model.available}
                    disabled={!model.available}
                    onClick={() => {
                      if (!model.available) return;
                      onSelect(model.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors enabled:hover:bg-accent disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-hairline bg-secondary/50">
                      {model.tier === "local" ? (
                        <Cpu className="size-3 text-muted-foreground" />
                      ) : (
                        <Cloud className="size-3 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] text-foreground">
                          {model.name} · {model.provider}
                        </span>
                        {!model.available ? (
                          <span className="shrink-0 rounded-md border border-hairline px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                            Not configured
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                        {model.detail}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}

          <p className="mt-1 flex gap-2 border-t border-hairline px-2.5 pt-2 pb-1 text-[10.5px] leading-relaxed text-muted-foreground">
            <Info className="mt-px size-3 shrink-0" />
            Selecting a provider will only choose the reasoning engine once one is connected. It
            never changes your permissions or document access.
          </p>
        </div>
      ) : null}
    </div>
  );
}

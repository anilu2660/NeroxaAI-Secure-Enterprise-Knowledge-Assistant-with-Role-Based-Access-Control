import { ChevronRight, Shield, Lock, KeyRound, FileKey, ShieldAlert, Cpu, Activity } from "lucide-react";
import { BorderBeam } from "@/shared/components/magicui/border-beam";

export const SECURITY_ITEMS = [
  { name: "Security Overview", icon: Shield },
  { name: "Data Protection", icon: Lock },
  { name: "Access Control (RBAC)", icon: KeyRound },
  { name: "Encryption", icon: FileKey },
  { name: "Compliance", icon: ShieldAlert },
  { name: "Security Architecture", icon: Cpu },
  { name: "Audit & Monitoring", icon: Activity },
];

export function SecurityDropdown({ onSelect }: { onSelect: (title: string) => void }) {
  return (
    <div
      role="menu"
      aria-label="Security"
      className="relative overflow-hidden w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-hairline bg-card/95 p-2 shadow-2xl backdrop-blur-2xl duration-200"
    >
      <BorderBeam size={180} duration={10} delay={0} colorFrom="#10b981" colorTo="#3b82f6" />

      <div className="space-y-1">
        {SECURITY_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              role="menuitem"
              onClick={() => onSelect(item.name)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-accent/70 focus-visible:bg-accent focus-visible:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-3.5" />
                </span>
                <span className="text-[13px] font-medium text-foreground/90 group-hover:text-foreground">
                  {item.name}
                </span>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

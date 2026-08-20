import { ShieldCheck, Zap, Database, Lock } from "lucide-react";
import { MagicCard } from "@/shared/components/magicui/magic-card";

const STATS = [
  {
    icon: ShieldCheck,
    value: "99.99%",
    label: "RBAC Enforcement",
    description: "Strict departmental isolation before retrieval",
  },
  {
    icon: Zap,
    value: "< 180ms",
    label: "Hybrid Search Latency",
    description: "Dense vectors + sparse BM25 reranked",
  },
  {
    icon: Lock,
    value: "100% Private",
    label: "Local LLM Inference",
    description: "Zero external model training or leaks",
  },
  {
    icon: Database,
    value: "0 Duplicates",
    label: "Deduplication Engine",
    description: "Sha256 document hashing & indexing",
  },
];

export function StatsBar() {
  return (
    <section className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {STATS.map((stat) => (
          <MagicCard
            key={stat.label}
            className="p-5"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-xs transition-transform duration-300 group-hover:scale-110">
                <stat.icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {stat.value}
                </p>
                <p className="font-display text-xs font-semibold text-foreground/90">{stat.label}</p>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              {stat.description}
            </p>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}

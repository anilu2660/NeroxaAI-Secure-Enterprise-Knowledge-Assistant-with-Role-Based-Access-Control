import { ChevronRight, Bot, ShieldCheck, Sparkles, Cpu, FileCheck2 } from "lucide-react";
import { BorderBeam } from "@/shared/components/magicui/border-beam";

export const FEATURE_ITEMS = [
  {
    title: "AI Knowledge Assistant",
    description:
      "Ask natural language questions across enterprise documents and receive accurate, context-aware answers backed by source citations.",
    icon: Bot,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Role-Based Access Control (RBAC)",
    description:
      "Protect confidential information with department-wise access control, ensuring every user only retrieves documents they are authorized to access.",
    icon: ShieldCheck,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    title: "Semantic Search & RAG",
    description:
      "Retrieve information based on meaning instead of keywords using enterprise-grade Retrieval-Augmented Generation and vector search.",
    icon: Sparkles,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Local AI & Privacy",
    description:
      "Run Llama 3 locally through Ollama so sensitive organizational knowledge never leaves your infrastructure.",
    icon: Cpu,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Audit & Compliance",
    description:
      "Track every login, query, document upload, sharing event, and administrative action with complete audit logs for enterprise compliance.",
    icon: FileCheck2,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
];

export function FeaturesDropdown({ onSelect }: { onSelect: (title: string) => void }) {
  return (
    <div
      role="menu"
      aria-label="Features"
      className="relative overflow-hidden w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl border border-hairline bg-card/95 p-2 shadow-2xl backdrop-blur-2xl duration-200"
    >
      <BorderBeam size={260} duration={12} delay={0} colorFrom="#3b82f6" colorTo="#a855f7" />

      <div className="space-y-1">
        {FEATURE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              role="menuitem"
              onClick={() => onSelect(item.title)}
              className="group flex w-full items-start gap-3.5 rounded-xl p-3 text-left transition-all hover:bg-accent/70 focus-visible:bg-accent focus-visible:outline-none"
            >
              <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border ${item.color} shadow-sm transition-transform group-hover:scale-105`}>
                <Icon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                <span className="mt-1 block text-[11.5px] leading-relaxed text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { UploadCloud, Search, ArrowRight, Cpu } from "lucide-react";
import { MagicCard } from "@/shared/components/magicui/magic-card";

const STEPS = [
  {
    step: "01",
    icon: UploadCloud,
    title: "Ingest & Deduplicate",
    description: "Upload enterprise PDF, DOCX, or TXT manuals. The ingestion engine extracts text, computes SHA256 hashes to prevent duplicate vectors, and generates overlapping token chunks.",
    badge: "FastAPI + PyPDF",
  },
  {
    step: "02",
    icon: Search,
    title: "RBAC Gated Retrieval",
    description: "When a user asks a question, the middleware evaluates role and department boundaries before querying Qdrant dense vector store and the BAAI Cross-Encoder reranker.",
    badge: "Qdrant + BGE Rerank",
  },
  {
    step: "03",
    icon: Cpu,
    title: "Grounded Synthesis",
    description: "The local Ollama LLM synthesizes a concise, professional answer strictly grounded in the retrieved chunks, citing the exact document name, section, and page numbers.",
    badge: "Local Ollama + Citations",
  },
];

export function HowItWorks() {
  return (
    <section id="architecture" className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-16 lg:py-24">
      {/* Section Title */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
          <span>End-to-End Pipeline</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          How NeroxaAI Works
        </h2>
        <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
          A high-throughput, low-latency Retrieval-Augmented Generation pipeline built for privacy-conscious organizations.
        </p>
      </div>

      {/* 3 Step Pipeline Cards with MagicCard */}
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((item) => (
          <MagicCard
            key={item.step}
            className="flex flex-col justify-between p-7"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary tracking-widest">
                  STEP {item.step}
                </span>
                <span className="rounded-full border border-hairline bg-secondary/35 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {item.badge}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-xs transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="size-5.5" />
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline/60 flex items-center gap-2 text-[11px] font-semibold text-primary">
              <span>Verified Execution Flow</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import { UploadCloud, Search, Cpu, ArrowRight, Code2, CheckCircle2 } from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: "01",
    icon: UploadCloud,
    title: "Ingestion & SHA256 Deduplication",
    description:
      "Enterprise manuals (PDF, DOCX, TXT) are parsed. Text is extracted into 512-token chunks with 64-token overlap. SHA-256 document hashing guarantees duplicate vectors are never stored.",
    tech: "FastAPI · PyPDF · SHA256",
    codeSnippet: `{
  "document_id": "doc_8f94e21",
  "filename": "Global_Expense_Policy_2025.pdf",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427...",
  "department_scope": "Finance",
  "clearance_level": "Tier-2",
  "chunks_created": 48
}`,
  },
  {
    step: "02",
    icon: Search,
    title: "RBAC Gated Retrieval & Cross-Encoder",
    description:
      "At query time, the user's validated JWT claims restrict the search filter. Dense embeddings query Qdrant via cosine distance, followed by a BAAI Cross-Encoder reranking the top-5 candidates.",
    tech: "Qdrant Vector DB · BAAI/bge-small-en · Cosine",
    codeSnippet: `{
  "query": "international travel reimbursement cap",
  "user_claims": { "role": "Finance_Manager", "dept": "Finance" },
  "qdrant_filter": { "must": [{ "key": "dept", "match": "Finance" }] },
  "rerank_top_k": 5,
  "top_score": 0.942
}`,
  },
  {
    step: "03",
    icon: Cpu,
    title: "Grounded Local LLM Synthesis",
    description:
      "The retrieved context is injected into a strict system prompt. The private local Ollama instance synthesizes a factual response, citing exact PDF titles, page numbers, and paragraphs.",
    tech: "Ollama (Qwen 2.5 / Llama 3) · Verifiable Citations",
    codeSnippet: `{
  "model": "ollama/qwen2.5:7b-instruct-q4_K_M",
  "temperature": 0.0,
  "air_gapped": true,
  "synthesis_latency_ms": 118,
  "citations": ["Global_Expense_Policy_2025.pdf:p14"]
}`,
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const current = PIPELINE_STEPS[activeStep] ?? PIPELINE_STEPS[0]!;

  return (
    <section id="how-it-works" className="relative mx-auto w-full max-w-[1280px] px-6 py-16">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          Execution Flow
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          How NeroxaAI processes and protects internal knowledge.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          A high-throughput, low-latency Retrieval-Augmented Generation pipeline built from first principles for enterprise security.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Step Selector */}
        <div className="lg:col-span-5 space-y-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = idx === activeStep;
            return (
              <button
                key={step.step}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left rounded-[10px] border p-5 transition-all ${
                  isSelected
                    ? "border-primary bg-secondary/60 shadow-sm"
                    : "border-border bg-card/60 hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-[4px] ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      STEP {step.step}
                    </span>
                    <h3 className="font-display text-[15px] font-bold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <Icon
                    className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/60">
                  <span>{step.tech}</span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-primary font-sans font-medium text-[11px]">
                      Active Step <ArrowRight className="size-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Code / Payload Inspection Terminal */}
        <div className="lg:col-span-7 rounded-[10px] border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Code2 className="size-4 text-primary" />
              <span className="font-mono text-[12px] font-semibold text-foreground">
                Pipeline Stage Inspection — {current.title}
              </span>
            </div>
            <span className="rounded-[4px] border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              JSON Payload
            </span>
          </div>

          <div className="p-5 bg-secondary/15 space-y-4">
            <div className="rounded-[8px] border border-border bg-background p-4 overflow-x-auto">
              <pre className="font-mono text-[12px] leading-relaxed text-foreground/90">
                {current.codeSnippet}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-[6px] border border-border bg-background p-2.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                  Execution Guarantee
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> Deterministic &amp; Logged
                </span>
              </div>
              <div className="rounded-[6px] border border-border bg-background p-2.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                  Network Isolation
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> 100% On-Premises
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

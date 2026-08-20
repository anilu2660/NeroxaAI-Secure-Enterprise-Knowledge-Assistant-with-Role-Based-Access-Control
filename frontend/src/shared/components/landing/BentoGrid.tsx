import {
  ShieldCheck,
  Cpu,
  Database,
  FileCheck2,
  Zap,
  Globe,
  Sparkles,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { BorderBeam } from "@/shared/components/magicui/border-beam";
import { MagicCard } from "@/shared/components/magicui/magic-card";

export function BentoGrid() {
  return (
    <section id="features" className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-16 lg:py-24">
      {/* Section Header */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
          <Sparkles className="size-3.5" />
          <span>Core Capabilities</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Engineered for Strict Enterprise Security &amp; Accuracy.
        </h2>
        <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
          Every component in NeroxaAI is designed to eliminate hallucination, guarantee mathematical document provenance, and protect sensitive organizational knowledge.
        </p>
      </div>

      {/* Bento Grid Layout with MagicCards */}
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Large Span (2 columns on LG) — Departmental RBAC */}
        <MagicCard className="lg:col-span-2 bg-gradient-to-br from-card/90 via-card/65 to-primary/[0.04] p-7">
          <BorderBeam size={260} duration={14} delay={0} colorFrom="#3b82f6" colorTo="#a855f7" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
                <ShieldCheck className="size-6" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Access Enforcement
                </span>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Role-Based Access Control (RBAC)
                </h3>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Active Policy Engine
            </span>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            Knowledge retrieval is strictly evaluated at query-time. Employees only retrieve vectors belonging to their verified department (e.g. Finance, HR, Engineering) or authorized clearance tier.
          </p>

          {/* Interactive Visual Preview */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-hairline bg-secondary/35 p-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Finance Dept</span>
                <CheckCircle2 className="size-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">P&amp;L Statements, Balance Sheets, Audit Docs</p>
            </div>
            <div className="rounded-2xl border border-hairline bg-secondary/35 p-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Engineering</span>
                <CheckCircle2 className="size-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">System Architecture, API Specs, Schemas</p>
            </div>
            <div className="rounded-2xl border border-hairline bg-secondary/35 p-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>General Knowledge</span>
                <CheckCircle2 className="size-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Company Policies, Org Charts, Handbooks</p>
            </div>
          </div>
        </MagicCard>

        {/* Card 2: Local LLM Zero-Data-Leak */}
        <MagicCard className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
            <Cpu className="size-6" />
          </span>
          <h3 className="mt-5 font-display text-lg font-bold text-foreground">
            100% Private Local Inference
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Runs locally on Ollama (Qwen 2.5, Llama 3) with zero prompt data sent to external cloud AI providers.
          </p>
          <div className="mt-5 rounded-2xl border border-hairline bg-secondary/35 p-3">
            <div className="flex items-center gap-2">
              <Lock className="size-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-foreground">Air-Gapped Ready</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Your proprietary IP remains entirely in your private infrastructure.</p>
          </div>
        </MagicCard>

        {/* Card 3: Qdrant Vector Search & BGE Reranker */}
        <MagicCard className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
            <Database className="size-6" />
          </span>
          <h3 className="mt-5 font-display text-lg font-bold text-foreground">
            Qdrant Vector DB &amp; Reranker
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Cosine similarity dense vectors augmented with BAAI/bge-small-en-v1.5 and Cross-Encoder reranking for pinpoint relevance.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-secondary/35 px-3 py-2 text-[11px] font-semibold text-foreground">
            <span>Top-5 Rerank Precision</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary font-mono font-bold">98.4%</span>
          </div>
        </MagicCard>

        {/* Card 4: Verified Citations & Page Provenance */}
        <MagicCard className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
            <FileCheck2 className="size-6" />
          </span>
          <h3 className="mt-5 font-display text-lg font-bold text-foreground">
            Verifiable Page Citations
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Every sentence returned by the assistant includes clickable citations referencing the exact source PDF, document title, and page number.
          </p>
          <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/[0.08] p-3 text-[11px] font-medium text-foreground">
            <span className="font-semibold text-primary">Finance_Policy.pdf · Page 18</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">&quot;...eligible for travel reimbursement up to $2,500...&quot;</p>
          </div>
        </MagicCard>

        {/* Card 5: Redis Multi-Level Semantic Caching */}
        <MagicCard className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
            <Zap className="size-6" />
          </span>
          <h3 className="mt-5 font-display text-lg font-bold text-foreground">
            Redis Semantic Caching
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Identical and semantically equivalent queries hit Redis in &lt; 30ms, reducing GPU compute load while guaranteeing fresh TTL invalidation.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-secondary/35 px-3 py-2 text-[11px] font-semibold text-foreground">
            <span>Cache Hit Latency</span>
            <span className="text-emerald-400 font-mono font-bold">&lt; 25ms</span>
          </div>
        </MagicCard>

        {/* Card 6: Live Web Search Grounding */}
        <MagicCard className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-xs">
            <Globe className="size-6" />
          </span>
          <h3 className="mt-5 font-display text-lg font-bold text-foreground">
            SerpAPI Live Web Grounding
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Optionally enable real-time internet search when internal documents require market data, external vendor updates, or regulatory news.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-secondary/35 px-3 py-2 text-[11px] font-semibold text-foreground">
            <span>Live Search Engine</span>
            <span className="text-primary font-semibold">SerpAPI Google</span>
          </div>
        </MagicCard>
      </div>
    </section>
  );
}

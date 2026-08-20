import { useState } from "react";
import {
  ShieldCheck,
  Cpu,
  FileCheck2,
  Lock,
  XCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Server,
  CloudOff,
} from "lucide-react";

const ROLES = [
  {
    name: "Engineering",
    allowed: ["System Architecture", "API Specifications", "Security Runbooks", "General Policies"],
    blocked: ["Executive Compensation", "Audited Financials", "Employee Medical Records"],
  },
  {
    name: "Finance",
    allowed: ["P&L Statements", "Audited Financials", "Travel Expense Policy", "General Policies"],
    blocked: ["Engineering Source Code", "API Keys", "Employee Medical Records"],
  },
  {
    name: "HR Operations",
    allowed: ["Employee Handbooks", "Benefits Guides", "Medical Leave Policies", "General Policies"],
    blocked: ["Q4 Board Deck", "AWS Infrastructure Keys", "PostgreSQL HA Runbooks"],
  },
];

export function CoreBenefits() {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const activeRole = ROLES[selectedRoleIndex] ?? ROLES[0]!;

  return (
    <section id="benefits" className="relative mx-auto w-full max-w-[1280px] px-6 py-16">
      {/* Section Header */}
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          Core Capabilities
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Three non-negotiable guarantees for internal enterprise AI.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Eliminate hallucinations, guarantee mathematical document provenance, and protect sensitive organizational knowledge.
        </p>
      </div>

      {/* 3 Core Benefits Showcase Layout */}
      <div className="mt-12 space-y-8">
        {/* Benefit 1: Interactive Deterministic RBAC Boundaries */}
        <div className="rounded-[10px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-[6px] bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <ShieldCheck className="size-3.5" />
                <span>01. Deterministic RBAC Boundaries</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Query-time vector gating by department and tier.
              </h3>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                Unlike consumer chatbots where all documents sit in one open pool, NeroxaAI evaluates role boundaries inside the vector retrieval pipeline. Employees cannot retrieve, synthesize, or even see vector embeddings from unauthorized departments.
              </p>

              <div className="pt-2">
                <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground mb-2">
                  Test Role Boundary:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((role, idx) => (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => setSelectedRoleIndex(idx)}
                      className={`rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        selectedRoleIndex === idx
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Live RBAC Matrix Viewer */}
            <div className="lg:col-span-7 rounded-[8px] border border-border bg-secondary/20 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-mono text-[12px] font-medium text-foreground">
                  Active Filter: <span className="text-primary font-bold">{activeRole.name}</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Strict Deny-by-Default Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Accessible Knowledge Collections */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">
                    <CheckCircle2 className="size-3.5" />
                    <span>Authorized Collections</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeRole.allowed.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-[6px] border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[12px] text-foreground"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blocked Collections */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive uppercase tracking-wide">
                    <XCircle className="size-3.5" />
                    <span>Isolated &amp; Blocked</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeRole.blocked.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-[6px] border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[12px] text-muted-foreground line-through opacity-75"
                      >
                        <span className="size-1.5 rounded-full bg-destructive" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefit 2 & 3: Side-by-Side In-Depth Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefit 2: 100% Private Local Inference Architecture */}
          <div className="rounded-[10px] border border-border bg-card p-6 sm:p-7 flex flex-col justify-between shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-[6px] bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <Cpu className="size-3.5" />
                <span>02. 100% Private Local Inference</span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                Air-gapped on-premises execution.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Runs on private local LLMs via Ollama (Qwen 2.5, Llama 3) on your own hardware or VPC. Prompts, documents, and vectors are never sent to external cloud APIs.
              </p>
            </div>

            {/* Architecture Comparison Strip */}
            <div className="space-y-3 rounded-[8px] border border-border bg-secondary/20 p-4 text-[12px]">
              <div className="flex items-center justify-between pb-2 border-b border-border text-muted-foreground font-mono text-[11px]">
                <span>Cloud SaaS Chatbots</span>
                <span className="text-destructive font-semibold">Public WAN API Exposure</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-foreground">
                <span className="flex items-center gap-2 font-semibold">
                  <Server className="size-3.5 text-primary" />
                  NeroxaAI Air-Gapped Engine
                </span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <CloudOff className="size-3.5" /> 0 External Network Calls
                </span>
              </div>
            </div>
          </div>

          {/* Benefit 3: Verifiable Citations */}
          <div className="rounded-[10px] border border-border bg-card p-6 sm:p-7 flex flex-col justify-between shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-[6px] bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <FileCheck2 className="size-3.5" />
                <span>03. Verifiable Multi-Page Citations</span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                Zero hallucination with source provenance.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Every sentence synthesized by the engine includes direct, clickable links to the exact source PDF, document title, and page chunk.
              </p>
            </div>

            {/* Live Citation Provenance Card */}
            <div className="rounded-[8px] border border-border bg-secondary/20 p-4 space-y-2 text-[12px]">
              <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                <span className="text-primary font-semibold">SOC2_Audit_Controls_2025.pdf</span>
                <span>Page 42 · Paragraph 4</span>
              </div>
              <p className="text-[11.5px] italic text-foreground/80 bg-background/80 p-2.5 rounded-[6px] border border-border">
                &ldquo;All cryptographic keys must be rotated every 90 days with automated hash verification...&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

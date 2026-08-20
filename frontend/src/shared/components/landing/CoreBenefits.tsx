import { useState } from "react";
import {
  ShieldCheck,
  Cpu,
  FileCheck2,
  Lock,
  XCircle,
  CheckCircle2,
  Server,
  CloudOff,
  Hash,
} from "lucide-react";

const ROLES = [
  {
    name: "Engineering",
    clearance: "Level 4 · Engineering & Infra",
    allowed: ["System Architecture Specs", "Database HA Runbooks", "Security Incident Playbooks"],
    blocked: ["Executive Compensation & Payroll", "Audited Financial Statements", "Employee Health Records"],
    hash: "0x4f8a...c91e",
  },
  {
    name: "Finance",
    clearance: "Level 3 · Financial Operations",
    allowed: ["P&L Statements & Forecasts", "Travel Expense Policy", "Vendor Procurement Contracts"],
    blocked: ["Production Database Credentials", "Infrastructure IAM Secrets", "Employee Health Records"],
    hash: "0x88e1...3a0f",
  },
  {
    name: "HR Operations",
    clearance: "Level 2 · People Operations",
    allowed: ["Global Employee Handbooks", "Benefits & Health Guides", "Paid Leave Policies"],
    blocked: ["Q4 Board Strategy Decks", "Production AWS Secrets", "Infrastructure Runbooks"],
    hash: "0x12bb...9fd4",
  },
];

export function CoreBenefits() {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const activeRole = ROLES[selectedRoleIndex] ?? ROLES[0]!;

  return (
    <section id="benefits" className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      {/* Section Header */}
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          Enterprise Guarantees
        </span>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Three non-negotiable guarantees for internal AI.
        </h2>
        <p className="mt-2.5 sm:mt-3 text-[13.5px] sm:text-[14.5px] leading-relaxed text-muted-foreground">
          Eliminate hallucinations, verify document provenance, and mathematically prevent confidential cross-department data leaks.
        </p>
      </div>

      {/* 3 Core Benefits Showcase Layout */}
      <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
        {/* Benefit 1: Interactive Deterministic RBAC Boundaries */}
        <div className="rounded-[8px] border border-border bg-card p-4 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            <div className="lg:col-span-5 space-y-3 sm:space-y-4">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                01 / Deterministic Access Control
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Query-time vector gating by employee role.
              </h3>
              <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-muted-foreground">
                Unlike consumer chatbots where all files sit in one shared pool, Nexora AI enforces access policies inside the retrieval pipeline. Unauthorized staff cannot retrieve, synthesize, or extract embeddings from restricted documents.
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
                      className={`rounded-[6px] border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
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
            <div className="lg:col-span-7 rounded-[6px] border border-border bg-secondary/15 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 font-mono text-[11.5px]">
                  <span className="text-muted-foreground">Active Identity:</span>
                  <span className="text-foreground font-semibold">{activeRole.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Clearance: {activeRole.clearance}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accessible Knowledge Collections */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-mono">
                    <CheckCircle2 className="size-3.5" />
                    <span>Authorized Collections</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeRole.allowed.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-[4px] border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11.5px] text-foreground"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blocked Collections */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-destructive uppercase tracking-wide font-mono">
                    <XCircle className="size-3.5" />
                    <span>Denied by Policy</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeRole.blocked.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-[4px] border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[11.5px] text-muted-foreground opacity-75"
                      >
                        <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                        <span className="truncate line-through">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefit 2 & 3: Side-by-Side In-Depth Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Benefit 2: 100% Private Local Inference Architecture */}
          <div className="rounded-[8px] border border-border bg-card p-5 sm:p-6 flex flex-col justify-between shadow-xs space-y-5">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                02 / Air-Gapped Privacy
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                Run 100% on-premises. Zero third-party transmission.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Execute inference locally on private Ollama backends (Llama 3, Qwen 2.5) on your hardware or private VPC. Prompts and embeddings never leave your firewall.
              </p>
            </div>

            {/* Architecture Comparison Strip */}
            <div className="space-y-2 rounded-[6px] border border-border bg-secondary/20 p-3 text-[11.5px] font-mono">
              <div className="flex items-center justify-between pb-1.5 border-b border-border text-muted-foreground">
                <span>Public Cloud AI Chatbots</span>
                <span className="text-destructive font-semibold">External WAN Calls</span>
              </div>
              <div className="flex items-center justify-between text-foreground">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Server className="size-3.5 text-primary" />
                  Nexora AI Private Engine
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CloudOff className="size-3.5" /> Zero Data Egress
                </span>
              </div>
            </div>
          </div>

          {/* Benefit 3: Verifiable Citations */}
          <div className="rounded-[8px] border border-border bg-card p-5 sm:p-6 flex flex-col justify-between shadow-xs space-y-5">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                03 / Verified Provenance
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                Audit-ready answers with verifiable citations.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Every synthesized response cites the exact source document, page number, and paragraph so teams can immediately audit findings.
              </p>
            </div>

            {/* Live Citation Provenance Card */}
            <div className="rounded-[6px] border border-border bg-secondary/20 p-3 space-y-1.5 text-[11.5px] font-mono">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-primary font-semibold truncate">Global_Expense_Policy_2025.pdf</span>
                <span className="shrink-0">Page 14 · Sec 4.2</span>
              </div>
              <p className="text-[11px] text-foreground/85 bg-background p-2 rounded-[4px] border border-border">
                &ldquo;International economy bookings up to $2,500 do not require VP approval...&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

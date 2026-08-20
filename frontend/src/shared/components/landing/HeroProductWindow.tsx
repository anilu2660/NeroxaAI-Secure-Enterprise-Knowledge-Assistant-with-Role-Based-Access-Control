import { useState } from "react";
import {
  FileText,
  Lock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  ChevronRight,
  Search,
} from "lucide-react";

interface DemoScenario {
  id: string;
  role: string;
  department: string;
  query: string;
  status: "authorized" | "denied";
  latency: string;
  confidence: number;
  retrievedDocs: { name: string; page: number; dept: string; matchScore: string }[];
  aiResponse: string;
  citation: string;
  cacheHit?: boolean;
}

const SCENARIOS: DemoScenario[] = [
  {
    id: "finance",
    role: "Finance Manager",
    department: "Finance & Accounting",
    query: "What is the maximum reimbursement cap for international flights without VP approval?",
    status: "authorized",
    latency: "142ms",
    confidence: 98,
    retrievedDocs: [
      { name: "Global_Expense_Policy_2025.pdf", page: 14, dept: "Finance", matchScore: "0.942" },
      { name: "Travel_Compliance_Addendum.pdf", page: 3, dept: "Finance", matchScore: "0.887" },
    ],
    aiResponse:
      "Per Section 4.2 of the Global Expense Policy, international economy flights up to $2,500 do not require VP approval. Any booking exceeding $2,500 or business-class upgrades requires written pre-authorization from the Department VP.",
    citation: "Global_Expense_Policy_2025.pdf · Page 14, Paragraph 3",
  },
  {
    id: "engineering",
    role: "Staff Infrastructure Engineer",
    department: "Engineering & SRE",
    query: "What is the failover SLA and max acceptable replication lag for our primary PostgreSQL cluster?",
    status: "authorized",
    latency: "168ms",
    confidence: 96,
    retrievedDocs: [
      { name: "Database_HA_Runbook_v3.pdf", page: 8, dept: "Engineering", matchScore: "0.961" },
      { name: "Disaster_Recovery_Architecture.pdf", page: 22, dept: "Engineering", matchScore: "0.894" },
    ],
    aiResponse:
      "The PostgreSQL HA runbook defines an automated Patroni failover SLA of < 30 seconds. Maximum allowable asynchronous replication lag across availability zones is bounded to 500ms before alerts escalate to the on-call engineer.",
    citation: "Database_HA_Runbook_v3.pdf · Page 8, Section 2.1",
  },
  {
    id: "unauthorized",
    role: "Marketing Specialist",
    department: "Growth & Marketing",
    query: "Retrieve executive salary bands and Q4 board-level equity dilution spreadsheets.",
    status: "denied",
    latency: "28ms",
    confidence: 0,
    retrievedDocs: [],
    aiResponse:
      "Access Denied (RBAC Policy Violation): Your clearance tier (Growth & Marketing) does not have read permissions for Executive Compensation & Board Governance vectors. This retrieval attempt has been immutably logged to the audit trail.",
    citation: "Audit Event #4892 · Deny-by-default retrieval policy enforced",
  },
];

export function HeroProductWindow() {
  const [activeTab, setActiveTab] = useState<string>("finance");
  const scenario = SCENARIOS.find((s) => s.id === activeTab) ?? SCENARIOS[0]!;

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-6 pb-16">
      {/* Product Demonstration Container */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
        {/* Workspace Mockup Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 pr-2 border-r border-border">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <span className="font-mono text-[12px] font-medium text-foreground/80">
              NeroxaAI Workspace
            </span>
            <span className="rounded-[4px] border border-border bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              v2.4-airgap
            </span>
          </div>

          {/* Scenario Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-[6px] border border-border bg-background/80 p-0.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id)}
                className={`rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === s.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {s.id === "finance"
                  ? "Finance Query"
                  : s.id === "engineering"
                    ? "Engineering Query"
                    : "Unauthorized Attempt"}
              </button>
            ))}
          </div>
        </div>

        {/* Product Workspace Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Column: Query Context & RBAC Evaluation */}
          <div className="p-5 lg:col-span-4 bg-secondary/15 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                  Authenticated Identity
                </p>
                <div className="mt-1 flex items-center justify-between rounded-[6px] border border-border bg-background p-2.5 text-[12px]">
                  <div>
                    <p className="font-semibold text-foreground">{scenario.role}</p>
                    <p className="text-[11px] text-muted-foreground">{scenario.department}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-medium ${
                      scenario.status === "authorized"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {scenario.status === "authorized" ? (
                      <ShieldCheck className="size-3" />
                    ) : (
                      <ShieldAlert className="size-3" />
                    )}
                    {scenario.status === "authorized" ? "RBAC Clear" : "Restricted"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                  Pipeline Execution
                </p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-[6px] border border-border bg-background p-2">
                    <p className="text-[10px] text-muted-foreground">Search Latency</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{scenario.latency}</p>
                  </div>
                  <div className="rounded-[6px] border border-border bg-background p-2">
                    <p className="text-[10px] text-muted-foreground">Confidence</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">
                      {scenario.confidence ? `${scenario.confidence}%` : "0% (Blocked)"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                  Retrieved Vectors ({scenario.retrievedDocs.length})
                </p>
                <div className="mt-1 space-y-1.5">
                  {scenario.retrievedDocs.length > 0 ? (
                    scenario.retrievedDocs.map((doc) => (
                      <div
                        key={doc.name}
                        className="flex items-center justify-between rounded-[6px] border border-border bg-background px-2.5 py-1.5 text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate font-medium text-foreground">{doc.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          p.{doc.page} · {doc.matchScore}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[6px] border border-dashed border-border bg-background/50 p-3 text-center text-[11px] text-muted-foreground">
                      0 vectors exposed to this role
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Database className="size-3.5 text-primary" />
                Qdrant Vector DB
              </span>
              <span className="font-mono">Local Ollama LLM</span>
            </div>
          </div>

          {/* Right Column: Interactive Chat & Citations */}
          <div className="p-5 lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* User Prompt Bubble */}
              <div className="flex items-start gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-border bg-secondary text-[11px] font-semibold text-foreground">
                  Q
                </div>
                <div className="flex-1 rounded-[8px] border border-border bg-secondary/30 px-3.5 py-2.5 text-[13px] text-foreground font-medium">
                  {scenario.query}
                </div>
              </div>

              {/* AI Response Box */}
              <div className="flex items-start gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-primary text-[11px] font-semibold text-primary-foreground">
                  AI
                </div>
                <div className="flex-1 rounded-[8px] border border-border bg-background p-4 space-y-3">
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    {scenario.aiResponse}
                  </p>

                  {/* Verifiable Citation Strip */}
                  <div
                    className={`flex items-center justify-between rounded-[6px] border px-3 py-2 text-[11px] ${
                      scenario.status === "authorized"
                        ? "border-primary/25 bg-primary/5 text-primary"
                        : "border-destructive/25 bg-destructive/5 text-destructive"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText className="size-3.5" />
                      {scenario.citation}
                    </span>
                    {scenario.status === "authorized" && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold underline underline-offset-2">
                        View Page <ExternalLink className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Bar in Demo */}
            <div className="flex items-center gap-2 rounded-[6px] border border-border bg-secondary/30 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                readOnly
                value="Ask a follow-up query about enterprise policy or system specs..."
                className="w-full bg-transparent text-[12px] text-muted-foreground focus:outline-none cursor-default"
              />
              <span className="rounded-[4px] border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                Enter
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

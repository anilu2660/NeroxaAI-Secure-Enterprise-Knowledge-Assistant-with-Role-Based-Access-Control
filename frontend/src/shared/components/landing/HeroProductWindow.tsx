import { useState } from "react";
import {
  FileText,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Database,
  ExternalLink,
  Search,
  CheckCircle2,
  Cpu,
  Fingerprint,
} from "lucide-react";

interface DemoScenario {
  id: string;
  role: string;
  clearance: string;
  department: string;
  query: string;
  status: "authorized" | "denied";
  latency: string;
  confidence: number;
  unlockedDocs: { name: string; page: number; matchScore: string }[];
  lockedDocs: string[];
  aiResponse: string;
  citation: string;
  filterFormula: string;
}

const SCENARIOS: DemoScenario[] = [
  {
    id: "finance",
    role: "Financial Controller",
    clearance: "Level 3 · Finance & Executive",
    department: "Finance & Accounting",
    query: "What is the maximum reimbursement cap for international flights without VP approval?",
    status: "authorized",
    latency: "142ms",
    confidence: 98.4,
    unlockedDocs: [
      { name: "Global_Expense_Policy_2025.pdf", page: 14, matchScore: "0.942" },
      { name: "Travel_Compliance_Addendum.pdf", page: 3, matchScore: "0.887" },
    ],
    lockedDocs: ["Engineering_DB_Credentials.enc", "HR_Payroll_Salary_Bands.xlsx"],
    aiResponse:
      "Per Section 4.2 of the Global Expense Policy, international economy bookings up to $2,500 do not require VP approval. Any ticket exceeding $2,500 or business-class upgrades requires written pre-authorization from the Department VP.",
    citation: "Global_Expense_Policy_2025.pdf · Page 14, Paragraph 3",
    filterFormula: 'department == "Finance" AND clearance >= 3',
  },
  {
    id: "engineering",
    role: "Staff Infrastructure Engineer",
    clearance: "Level 4 · Engineering & Infra",
    department: "Engineering & SRE",
    query: "What is the failover SLA and max acceptable replication lag for our primary PostgreSQL cluster?",
    status: "authorized",
    latency: "168ms",
    confidence: 96.8,
    unlockedDocs: [
      { name: "Database_HA_Runbook_v3.pdf", page: 8, matchScore: "0.961" },
      { name: "Disaster_Recovery_Architecture.pdf", page: 22, matchScore: "0.894" },
    ],
    lockedDocs: ["Q4_Executive_Compensation.pdf", "HR_Disciplinary_Guidelines.pdf"],
    aiResponse:
      "The PostgreSQL HA runbook defines an automated Patroni failover SLA of < 30 seconds. Maximum allowable asynchronous replication lag across availability zones is bounded to 500ms before alerts escalate to the on-call engineer.",
    citation: "Database_HA_Runbook_v3.pdf · Page 8, Section 2.1",
    filterFormula: 'department == "Engineering" AND env == "Production"',
  },
  {
    id: "unauthorized",
    role: "Growth Marketing Specialist",
    clearance: "Level 1 · Marketing & Public",
    department: "Growth & Marketing",
    query: "Retrieve executive compensation bands and board equity dilution cap tables.",
    status: "denied",
    latency: "24ms",
    confidence: 0,
    unlockedDocs: [],
    lockedDocs: [
      "Q4_Executive_Compensation.pdf",
      "Board_Equity_Cap_Table_2025.xlsx",
      "Executive_Payroll_Summary.pdf",
    ],
    aiResponse:
      "Access Denied (Deterministic RBAC Violation): Your security clearance [Level 1 · Marketing] does not have read permissions for Executive Compensation & Board Governance vectors. This attempt has been immutably recorded to the cryptographic audit trail.",
    citation: "Audit Event #4892 · Deny-by-default retrieval policy enforced at FastAPI gateway",
    filterFormula: 'CLEARANCE_CHECK: DENIED (Required Level 4, User has Level 1)',
  },
];

export function HeroProductWindow() {
  const [activeTab, setActiveTab] = useState<string>("finance");
  const scenario = SCENARIOS.find((s) => s.id === activeTab) ?? SCENARIOS[0]!;

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 pb-12 sm:pb-16">
      {/* Product Demonstration Container */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
        {/* Workspace Mockup Header Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-border bg-secondary/40 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5 pr-2 border-r border-border">
              <span className="size-2 sm:size-2.5 rounded-full bg-border" />
              <span className="size-2 sm:size-2.5 rounded-full bg-border" />
              <span className="size-2 sm:size-2.5 rounded-full bg-border" />
            </div>
            <span className="font-mono text-[11px] sm:text-[12px] font-medium text-foreground truncate">
              Nexora AI Workspace
            </span>
            <span className="rounded-[4px] border border-border bg-background px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10px] font-mono text-muted-foreground">
              v2.4-airgapped
            </span>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-[6px] border border-border bg-background p-0.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id)}
                className={`shrink-0 rounded-[4px] px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === s.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {s.id === "finance"
                  ? "Finance"
                  : s.id === "engineering"
                    ? "Engineering"
                    : "Unauthorized"}
              </button>
            ))}
          </div>
        </div>

        {/* Product Workspace Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Column: Query Context & RBAC Evaluation */}
          <div className="p-3.5 sm:p-5 lg:col-span-4 bg-secondary/15 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                  Authenticated Identity &amp; Scope
                </p>
                <div className="mt-1 flex items-center justify-between rounded-[6px] border border-border bg-background p-2.5 text-[12px] gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{scenario.role}</p>
                    <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-mono truncate">{scenario.clearance}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-mono font-medium ${
                      scenario.status === "authorized"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
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
                  Query-Time RBAC Filter Formula
                </p>
                <div className="mt-1 rounded-[6px] border border-border bg-background p-2 font-mono text-[10px] sm:text-[10.5px] text-muted-foreground overflow-x-auto">
                  <code>{scenario.filterFormula}</code>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                  <span>Authorized Repository Chunks</span>
                  <span>{scenario.unlockedDocs.length} Active</span>
                </div>
                <div className="mt-1 space-y-1.5">
                  {scenario.unlockedDocs.map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded-[6px] border border-border bg-background px-2.5 py-1.5 text-[11px] gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-3.5 shrink-0 text-primary" />
                        <span className="truncate font-medium text-foreground">{doc.name}</span>
                      </div>
                      <span className="font-mono text-[9.5px] sm:text-[10px] text-muted-foreground shrink-0">
                        p.{doc.page} · {doc.matchScore}
                      </span>
                    </div>
                  ))}

                  {scenario.lockedDocs.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-[6px] border border-dashed border-border bg-secondary/30 px-2.5 py-1.5 text-[11px] opacity-70 gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-muted-foreground">{name}</span>
                      </div>
                      <span className="font-mono text-[9.5px] text-destructive bg-destructive/10 px-1 rounded-[3px] shrink-0">
                        Blocked
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Database className="size-3.5 text-primary" />
                Qdrant HNSW Index
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="size-3.5 text-emerald-500" />
                Local Ollama LLM
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Chat & Citations */}
          <div className="p-3.5 sm:p-5 lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3 sm:space-y-4">
              {/* User Prompt Bubble */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="grid size-6 sm:size-7 shrink-0 place-items-center rounded-[6px] border border-border bg-secondary text-[10px] sm:text-[11px] font-mono font-semibold text-foreground">
                  Q
                </div>
                <div className="flex-1 rounded-[8px] border border-border bg-secondary/30 px-3 sm:px-3.5 py-2 sm:py-2.5 text-[12.5px] sm:text-[13px] text-foreground font-medium">
                  {scenario.query}
                </div>
              </div>

              {/* AI Response Box */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="grid size-6 sm:size-7 shrink-0 place-items-center rounded-[6px] bg-primary text-[10px] sm:text-[11px] font-mono font-semibold text-primary-foreground">
                  AI
                </div>
                <div className="flex-1 rounded-[8px] border border-border bg-background p-3 sm:p-4 space-y-2.5 sm:space-y-3 shadow-xs">
                  <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-foreground">
                    {scenario.aiResponse}
                  </p>

                  {/* Verifiable Citation Strip */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-[6px] border px-2.5 sm:px-3 py-2 text-[10.5px] sm:text-[11px] ${
                      scenario.status === "authorized"
                        ? "border-primary/25 bg-primary/5 text-primary"
                        : "border-destructive/25 bg-destructive/5 text-destructive"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-mono truncate">
                      <FileText className="size-3.5 shrink-0" />
                      <span className="truncate">{scenario.citation}</span>
                    </span>
                    {scenario.status === "authorized" && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold underline underline-offset-2 shrink-0">
                        Inspect Source <ExternalLink className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Input Indicator */}
            <div className="flex items-center gap-2 rounded-[6px] border border-border bg-secondary/30 px-2.5 sm:px-3 py-2">
              <Search className="size-3.5 sm:size-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                readOnly
                value="Ask a question grounded in authorized internal policies..."
                className="w-full bg-transparent text-[11.5px] sm:text-[12px] text-muted-foreground focus:outline-none cursor-default truncate"
              />
              <span className="hidden sm:inline-block rounded-[4px] border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground shrink-0">
                Enter ↵
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

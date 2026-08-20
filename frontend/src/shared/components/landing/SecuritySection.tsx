import { Shield, Key, Fingerprint, Lock, CheckCircle2, ShieldAlert } from "lucide-react";

const AUDIT_LOGS = [
  {
    time: "19:14:02 UTC",
    actor: "sarah.chen@nexora.internal",
    role: "Finance Lead",
    action: "QUERY_EXECUTE",
    resource: "Global_Expense_Policy_2025.pdf",
    status: "ALLOWED",
  },
  {
    time: "19:14:18 UTC",
    actor: "david.kim@nexora.internal",
    role: "Marketing Specialist",
    action: "UNAUTHORIZED_RETRIEVAL_ATTEMPT",
    resource: "Exec_Compensation_Q4.pdf",
    status: "BLOCKED_403",
  },
  {
    time: "19:15:40 UTC",
    actor: "alex.kumar@nexora.internal",
    role: "Security Admin",
    action: "POLICY_UPDATE",
    resource: "Tier-3 Engineering Vector ACL",
    status: "COMMITTED",
  },
  {
    time: "19:16:05 UTC",
    actor: "system.auth",
    role: "Twilio Verify 2FA",
    action: "SESSION_ROTATE_HTTPONLY",
    resource: "JWT Token Handshake",
    status: "ENCRYPTED_AES256",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="rounded-[8px] border border-border bg-card p-4 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          {/* Left Column: Security Blueprint */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            <div>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                Security Architecture
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Zero-Trust isolation from document ingestion to LLM inference.
              </h2>
              <p className="mt-2.5 sm:mt-3 text-[13.5px] sm:text-[14.5px] leading-relaxed text-muted-foreground">
                Engineered for financial institutions, defense, healthcare, and enterprise legal teams where unverified access or document leakage is an unacceptable compliance failure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-[6px] border border-border bg-secondary/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[12.5px]">
                  <Lock className="size-4 text-primary" />
                  <span>AES-256-GCM &amp; TLS 1.3</span>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  All vector partitions, cached embeddings, and raw document chunks encrypted at rest and in transit.
                </p>
              </div>

              <div className="rounded-[6px] border border-border bg-secondary/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[12.5px]">
                  <Key className="size-4 text-primary" />
                  <span>Deterministic JWT Claims</span>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  FastAPI RBAC middleware validates employee tier &amp; department claims before computing vector similarity.
                </p>
              </div>

              <div className="rounded-[6px] border border-border bg-secondary/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[12.5px]">
                  <Shield className="size-4 text-primary" />
                  <span>Deny-by-Default Retrieval</span>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Requests without an exact matching policy rule are blocked at gateway ingress before vector search.
                </p>
              </div>

              <div className="rounded-[6px] border border-border bg-secondary/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[12.5px]">
                  <Fingerprint className="size-4 text-primary" />
                  <span>Cryptographic Audit Trail</span>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Every search query, document mutation, and permission decision is recorded to an append-only PostgreSQL log.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Audit Event Stream Simulation */}
          <div className="lg:col-span-6 rounded-[6px] border border-border bg-secondary/15 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-[11.5px] font-semibold text-foreground">
                  Security Event Stream
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-muted-foreground">
                SOC2 Type II Standard
              </span>
            </div>

            <div className="space-y-2">
              {AUDIT_LOGS.map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-[4px] border border-border bg-background p-2.5 text-[11px] font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">{log.time}</span>
                    <span
                      className={`rounded-[3px] px-1.5 py-0.2 text-[9px] font-bold ${
                        log.status.includes("ALLOWED") || log.status.includes("COMMITTED")
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : log.status.includes("BLOCKED")
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-foreground/90 text-[11px]">
                    <span className="font-semibold text-primary">{log.actor}</span> ({log.role})
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                    <span>Action: {log.action}</span>
                    <span className="truncate max-w-[180px]">{log.resource}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

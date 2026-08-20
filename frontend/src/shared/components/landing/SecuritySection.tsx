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
      <div className="rounded-[10px] border border-border bg-card p-4 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          {/* Left Column: Security Blueprint */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            <div>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                Security &amp; Compliance
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Zero-Trust architecture from vector storage to inference.
              </h2>
              <p className="mt-2.5 sm:mt-3 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
                Engineered for defense, financial institutions, healthcare, and regulated enterprises where unverified access or document leakage is an unacceptable risk.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-[8px] border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                  <Lock className="size-4 text-primary" />
                  <span>AES-256 Encryption</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  All vector embeddings and source document chunks encrypted at rest and in transit.
                </p>
              </div>

              <div className="rounded-[8px] border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                  <Key className="size-4 text-primary" />
                  <span>Twilio 2FA + OAuth2</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Carrier-grade SMS two-factor authentication and single sign-on with Google and Microsoft.
                </p>
              </div>

              <div className="rounded-[8px] border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                  <Shield className="size-4 text-primary" />
                  <span>Deny-by-Default ACL</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Queries are rejected if explicit clearance tier or department membership is not met.
                </p>
              </div>

              <div className="rounded-[8px] border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                  <Fingerprint className="size-4 text-primary" />
                  <span>Immutable Audit Log</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Every search query, document upload, and permission modification is recorded for compliance.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Audit Event Stream Simulation */}
          <div className="lg:col-span-6 rounded-[8px] border border-border bg-secondary/20 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[12px] font-semibold text-foreground">
                  Security Event Stream
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                SOC2 Type II Audit Standard
              </span>
            </div>

            <div className="space-y-2.5">
              {AUDIT_LOGS.map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-[6px] border border-border bg-background p-3 text-[11px] font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{log.time}</span>
                    <span
                      className={`rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold ${
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
                  <div className="text-foreground/90">
                    <span className="font-semibold text-primary">{log.actor}</span> ({log.role})
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                    <span>Action: {log.action}</span>
                    <span className="truncate max-w-[180px]">{log.resource}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-muted-foreground font-mono">
                Continuous compliance monitoring active · Zero tamper guarantee
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

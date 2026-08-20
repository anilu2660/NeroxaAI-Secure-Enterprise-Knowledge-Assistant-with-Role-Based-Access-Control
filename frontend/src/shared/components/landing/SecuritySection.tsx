import { Shield, Key, Fingerprint, Lock, FileLock2, ServerShield, Check } from "lucide-react";

const PILLARS = [
  {
    icon: Lock,
    title: "Air-Gapped Local Inference",
    description: "Prompts and enterprise documents never leave your self-hosted network. Zero data sent to public AI APIs.",
  },
  {
    icon: Key,
    title: "OAuth2 & Two-Factor SMS OTP",
    description: "Enterprise single sign-on with Google, Microsoft 365, and GitHub, backed by carrier-grade Twilio Verify SMS.",
  },
  {
    icon: Shield,
    title: "Deterministic RBAC Boundaries",
    description: "Query middleware mathematically prevents users from retrieving documents outside their authorized department.",
  },
  {
    icon: Fingerprint,
    title: "Audit Logs & Access Traceability",
    description: "Every query, upload, permission toggle, and authentication event is immutably recorded with timestamp & user ID.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-16 lg:py-24">
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/60 to-primary/[0.05] p-8 sm:p-12 shadow-2xl backdrop-blur-2xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 shadow-xs">
              <Shield className="size-3.5" />
              <span>Enterprise Grade Security</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Zero-Trust Architecture from Vector Storage to Inference.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Designed for regulated industries including financial services, healthcare, legal, and government operations where data isolation is paramount.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "AES-256 vector store encryption at rest and in transit",
                "HttpOnly secure JWT cookies with short token lifespans",
                "Automatic Sha256 content deduplication preventing storage bloat",
                "Deny-by-default retrieval policy if role clearance is missing",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[13px] text-foreground/90 font-medium">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Check className="size-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-hairline/80 bg-secondary/30 p-5 shadow-xs transition-all duration-300 hover:border-primary/40 hover:bg-secondary/50"
              >
                <span className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-xs">
                  <pillar.icon className="size-5" />
                </span>
                <h3 className="mt-3.5 font-display text-sm font-bold text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Activity, ArrowUpRight, CheckCircle2, Clock3, LockKeyhole, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = {
  securityLabel?: string | undefined;
  securityDetail?: string | undefined;
  userCount?: number | undefined;
  documentCount?: number | undefined;
};

export function AdminSecurityPosture({
  securityLabel = "Security posture",
  securityDetail = "Review access, auditability, and knowledge-source controls from one place.",
  userCount,
  documentCount,
}: Props) {
  return (
    <div className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
            <ShieldAlert className="size-5" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">{securityLabel}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{securityDetail}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-[10.5px] font-semibold text-emerald-400 shadow-xs">
          <CheckCircle2 className="size-3.5" /> Protected
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <PostureMetric icon={LockKeyhole} label="RBAC" value="Enforced" />
        <PostureMetric icon={Activity} label="Audit" value="Ready" />
        <PostureMetric icon={Clock3} label="Session" value="Active" />
      </div>

      {(userCount !== undefined || documentCount !== undefined) && (
        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-muted-foreground">
          <span className="font-medium">{userCount ?? "—"} users · {documentCount ?? "—"} sources</span>
          <Link to="/access" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline underline-offset-2">
            Review controls <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function PostureMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-secondary/25 p-3 text-center transition-all hover:bg-secondary/45">
      <Icon className="mx-auto size-4 text-primary" />
      <p className="mt-1 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

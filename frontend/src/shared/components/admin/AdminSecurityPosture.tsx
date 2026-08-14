import { Activity, ArrowUpRight, CheckCircle2, Clock3, LockKeyhole, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = {
  securityLabel?: string;
  securityDetail?: string;
  userCount?: number;
  documentCount?: number;
};

export function AdminSecurityPosture({
  securityLabel = "Security posture",
  securityDetail = "Review access, auditability, and knowledge-source controls from one place.",
  userCount,
  documentCount,
}: Props) {
  return (
    <div className="rounded-2xl border border-hairline bg-card/55 p-3.5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-primary/25 bg-primary/[0.08]">
            <ShieldAlert className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium text-foreground">{securityLabel}</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">{securityDetail}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-2 py-1 text-[9.5px] font-medium text-emerald-300">
          <CheckCircle2 className="size-3" /> Protected
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <PostureMetric icon={LockKeyhole} label="RBAC" value="Enforced" />
        <PostureMetric icon={Activity} label="Audit" value="Ready" />
        <PostureMetric icon={Clock3} label="Session" value="Active" />
      </div>

      {(userCount !== undefined || documentCount !== undefined) && (
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[10.5px] text-muted-foreground">
          <span>{userCount ?? "—"} users · {documentCount ?? "—"} sources</span>
          <Link to="/access" className="inline-flex items-center gap-1 text-primary/90 hover:text-primary">
            Review controls <ArrowUpRight className="size-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function PostureMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-secondary/25 px-2.5 py-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[10.5px] font-medium text-foreground/90">{value}</p>
    </div>
  );
}

import { Building2, FileText, ListOrdered, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import type {
  DocumentServiceStatus,
  DocumentUploadConstraints,
  UploadWorkflowStage,
} from "@/api/types";
import { cn } from "@/shared/utils/utils";

function PanelCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          {icon}
        </span>
        <h2 className="font-display text-[13.5px] font-semibold text-foreground">
          {title}
        </h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Explains what Department and Access Scope govern.
 */
export function SecurityAccessContextPanel({
  department,
  accessScopeLabel,
}: {
  department?: string;
  accessScopeLabel?: string;
}) {
  return (
    <PanelCard title="Security & Access Context" icon={<ShieldCheck className="size-4" />}>
      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        The selected Department and Access Scope determine retrieval boundaries through RBAC vector filtering.
      </p>
      <ul className="mt-3 space-y-2.5">
        <li className="flex items-start gap-2.5 rounded-2xl border border-hairline/60 bg-secondary/20 p-2.5">
          <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Department</span> controls ownership
            {department ? (
              <span className="ml-1 font-semibold text-primary">({department})</span>
            ) : (
              " — not selected"
            )}.
          </p>
        </li>
        <li className="flex items-start gap-2.5 rounded-2xl border border-hairline/60 bg-secondary/20 p-2.5">
          <Users className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Access Scope</span> defines visibility
            {accessScopeLabel ? (
              <span className="ml-1 font-semibold text-primary">({accessScopeLabel})</span>
            ) : (
              " — auto scope"
            )}.
          </p>
        </li>
        <li className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
          <p className="leading-relaxed">
            FastAPI RBAC authorization enforces query retrieval boundaries across organizational vectors.
          </p>
        </li>
      </ul>
    </PanelCard>
  );
}

/** Genuinely enforced frontend constraints. */
export function SupportedFilesPanel({ constraints }: { constraints: DocumentUploadConstraints }) {
  return (
    <PanelCard title="Supported Formats" icon={<FileText className="size-4" />}>
      <dl className="space-y-2">
        {constraints.supportedFiles.map((entry) => (
          <div key={entry.extension} className="flex items-center justify-between rounded-xl bg-secondary/25 px-3 py-2 border border-hairline/60">
            <dt className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
              {entry.extension}
            </dt>
            <dd className="text-[11.5px] text-muted-foreground">{entry.label}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-hairline pt-2.5 text-[11px] font-medium text-muted-foreground">
        Max file size: <span className="font-semibold text-foreground">{constraints.maxSizeLabel}</span>
      </p>
    </PanelCard>
  );
}

/**
 * Ingestion workflow steps.
 */
export function UploadWorkflowPanel({
  stages,
  serviceStatus,
}: {
  stages: UploadWorkflowStage[];
  serviceStatus?: DocumentServiceStatus | null;
}) {
  return (
    <PanelCard title="Ingestion Pipeline" icon={<ListOrdered className="size-4" />}>
      <ol className="space-y-2">
        {(stages ?? []).map((stage, index) => {
          const available = stage.state === "available";
          return (
            <li key={stage.id} className="flex items-center gap-2.5 rounded-xl bg-secondary/20 p-2 border border-hairline/50" title={stage.detail}>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-lg border text-[11px] font-bold shadow-xs",
                  available
                    ? "border-primary/45 bg-primary/15 text-primary"
                    : "border-hairline bg-secondary/40 text-muted-foreground/70",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-[12px] font-medium",
                  available ? "text-foreground" : "text-muted-foreground/70",
                )}
              >
                {stage.label}
              </span>
              <span
                className={cn(
                  "ml-auto rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                  available ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-secondary/40 text-muted-foreground/60 border border-hairline",
                )}
              >
                {available ? "Active" : "Planned"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 border-t border-hairline pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {serviceStatus?.state === "connected"
          ? serviceStatus.detail
          : "Backend services vectorize and index files in real-time."}
      </p>
    </PanelCard>
  );
}

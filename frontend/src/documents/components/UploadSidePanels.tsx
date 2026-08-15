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
    <section className="rounded-2xl border border-hairline bg-card/60 p-3.5 backdrop-blur-xl">
      <h2 className="flex items-center gap-2 text-[12.5px] font-medium text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * Explains what Department and Access Scope will govern once RBAC-filtered
 * retrieval exists, and states plainly that it is not enforced today.
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
        The selected Department and Access Scope will determine who can retrieve this document
        through RBAC-filtered retrieval once that pipeline is connected.
      </p>
      <ul className="mt-2.5 space-y-2">
        <li className="flex gap-2">
          <Building2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="text-foreground/90">Department</span> determines organizational
            ownership and stewardship
            {department ? ` — currently ${department}` : " — not selected yet"}.
          </p>
        </li>
        <li className="flex gap-2">
          <Users className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="text-foreground/90">Access Scope</span> defines intended visibility and
            retrieval permissions
            {accessScopeLabel ? ` — currently ${accessScopeLabel}` : " — not selected yet"}.
          </p>
        </li>
        <li className="flex gap-2">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            RBAC enforcement is not active. These values are recorded as configuration intent only.
          </p>
        </li>
      </ul>
    </PanelCard>
  );
}

/** Genuinely enforced frontend constraints — nothing about server acceptance. */
export function SupportedFilesPanel({ constraints }: { constraints: DocumentUploadConstraints }) {
  return (
    <PanelCard title="Supported Files" icon={<FileText className="size-4" />}>
      <dl className="space-y-1.5">
        {constraints.supportedFiles.map((entry) => (
          <div key={entry.extension} className="flex items-baseline gap-3">
            <dt className="w-12 shrink-0 text-[11.5px] font-medium text-foreground">
              {entry.extension}
            </dt>
            <dd className="text-[11.5px] text-muted-foreground">{entry.label}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 border-t border-hairline pt-2.5 text-[11.5px] text-muted-foreground">
        Max file size: {constraints.maxSizeLabel} · checked in the browser before submission
      </p>
    </PanelCard>
  );
}

/**
 * The intended ingestion pipeline. Frontend stages are marked available;
 * backend stages are explicitly planned and never rendered as completed.
 */
export function UploadWorkflowPanel({
  stages,
  serviceStatus,
}: {
  stages: UploadWorkflowStage[];
  serviceStatus?: DocumentServiceStatus | null;
}) {
  return (
    <PanelCard title="Upload Workflow (Planned)" icon={<ListOrdered className="size-4" />}>
      <ol className="space-y-1.5">
        {(stages ?? []).map((stage, index) => {
          const available = stage.state === "available";
          return (
            <li key={stage.id} className="flex items-center gap-2.5" title={stage.detail}>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                  available
                    ? "border-primary/45 bg-primary/12 text-foreground/90"
                    : "border-hairline bg-secondary/30 text-muted-foreground/70",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-[11.5px]",
                  available ? "text-foreground/85" : "text-muted-foreground/70",
                )}
              >
                {stage.label}
              </span>
              <span
                className={cn(
                  "ml-auto text-[10px] uppercase tracking-[0.08em]",
                  available ? "text-primary/80" : "text-muted-foreground/60",
                )}
              >
                {available ? "Frontend" : "Planned"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2.5 border-t border-hairline pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {serviceStatus?.state === "connected"
          ? serviceStatus.detail
          : "Backend stages will run after document-service integration. No stage has executed for any document."}
      </p>
    </PanelCard>
  );
}

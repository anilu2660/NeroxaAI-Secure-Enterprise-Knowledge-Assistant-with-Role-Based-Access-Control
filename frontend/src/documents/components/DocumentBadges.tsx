import { Building2, FileText, Globe, Lock, Users } from "lucide-react";
import type { AdminDocumentScopeKind, AdminDocumentStatus } from "@/api/types";
import { cn } from "@/shared/utils/utils";

const typeTone: Record<string, string> = {
  Policy: "border-destructive/30 bg-destructive/10 text-destructive",
  SOP: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  Handbook: "border-allowed/30 bg-allowed/10 text-allowed",
};

const scopeTone: Record<AdminDocumentScopeKind, string> = {
  organization: "border-primary/35 bg-primary/12 text-primary",
  department: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  restricted: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

const scopeIcon: Record<AdminDocumentScopeKind, typeof Globe> = {
  organization: Globe,
  department: Users,
  restricted: Lock,
};

export const scopeHint: Record<AdminDocumentScopeKind, string> = {
  organization: "Configured for organization-wide retrieval",
  department: "Configured for the owning department only",
  restricted: "Configured as restricted access",
};

/**
 * Repository states. "Listed" deliberately does NOT say "Available": the record
 * is listed in the catalog, but nothing has been stored, parsed, or indexed
 * because no document service is connected.
 */
export const documentStatusLabel: Record<AdminDocumentStatus, string> = {
  available: "Listed",
  archived: "Archived",
};

export const documentStatusHint: Record<AdminDocumentStatus, string> = {
  available: "Listed in the catalog — not stored or indexed (no document service connected)",
  archived: "Archived by an administrator — hidden from the user knowledge library",
};

export function DocumentTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]",
        typeTone[type] ?? "border-hairline bg-secondary/45 text-foreground/80",
      )}
    >
      <FileText className="size-3" />
      {type}
    </span>
  );
}

export function AccessScopeBadge({ kind, label }: { kind: AdminDocumentScopeKind; label: string }) {
  const Icon = scopeIcon[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]",
        scopeTone[kind],
      )}
      title={scopeHint[kind]}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: AdminDocumentStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] text-foreground/85"
      title={documentStatusHint[status]}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "available" ? "bg-allowed" : "bg-muted-foreground",
        )}
      />
      {documentStatusLabel[status]}
    </span>
  );
}

export function DepartmentIcon() {
  return <Building2 className="size-3.5 text-muted-foreground" />;
}

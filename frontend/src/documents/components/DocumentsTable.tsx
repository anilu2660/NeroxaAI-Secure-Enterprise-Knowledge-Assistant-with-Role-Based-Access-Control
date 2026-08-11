import { Link } from "@tanstack/react-router";
import { Eye, FileText, Globe, Lock } from "lucide-react";
import type { DocumentRecord } from "@/api/types";
import { cn } from "@/shared/utils/utils";

const typeTone: Record<string, string> = {
  Policy: "border-primary/35 bg-primary/12 text-primary",
  SOP: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  Handbook: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export function DocumentsTable({
  documents,
  restrictedIds,
}: {
  documents: DocumentRecord[];
  /** Ids outside the current session's configured scope (frontend model only). */
  restrictedIds: Set<string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card/60 backdrop-blur-xl">
      <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_64px] gap-3 border-b border-hairline px-4 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground lg:grid">
        <span>Document Name</span>
        <span>Department</span>
        <span>Type</span>
        <span>Access Scope</span>
        <span>Last Updated</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-hairline">
        {documents.map((doc) => {
          const restricted = restrictedIds.has(doc.id);
          return (
            <div
              key={doc.id}
              className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-accent/35 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_64px] lg:items-center lg:gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-hairline bg-secondary/60 text-[9px] font-semibold text-foreground/80">
                  {doc.kind}
                </span>
                <span className="min-w-0">
                  <Link
                    to="/documents/$documentId"
                    params={{ documentId: doc.id }}
                    className="block truncate text-[13px] text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary focus-visible:underline"
                  >
                    {doc.title}
                  </Link>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {doc.description}
                  </span>
                </span>
              </div>

              <span className="truncate text-[12.5px] text-foreground/85">{doc.department}</span>

              <span>
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-0.5 text-[11px]",
                    typeTone[doc.documentType] ??
                      "border-hairline bg-secondary/50 text-foreground/80",
                  )}
                >
                  {doc.documentType}
                </span>
              </span>

              <span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]",
                    doc.accessRestricted
                      ? "border-hairline bg-secondary/50 text-foreground/80"
                      : "border-allowed/30 bg-allowed/10 text-allowed",
                  )}
                >
                  {doc.accessRestricted ? (
                    <Lock className="size-3" />
                  ) : (
                    <Globe className="size-3" />
                  )}
                  {doc.accessScope}
                </span>
              </span>

              <span className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[9.5px] text-foreground/80">
                  {initials(doc.updatedBy)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-foreground/85">
                    {doc.updatedLabel}
                  </span>
                  <span className="block truncate text-[10.5px] text-muted-foreground">
                    by {doc.updatedBy}
                  </span>
                </span>
              </span>

              <span className="flex justify-start lg:justify-end">
                {restricted ? (
                  <span
                    className="grid size-8 place-items-center rounded-lg border border-hairline bg-secondary/30 text-muted-foreground/70"
                    title="Outside your configured access scope in this prototype session"
                  >
                    <Lock className="size-3.5" />
                  </span>
                ) : (
                  <Link
                    to="/documents/$documentId"
                    params={{ documentId: doc.id }}
                    aria-label={`Open ${doc.title}`}
                    title="Open document details"
                    className="grid size-8 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/80 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
                  >
                    <Eye className="size-3.5" />
                  </Link>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {documents.length === 0 ? (
        <div className="grid place-items-center px-6 py-12 text-center">
          <FileText className="size-5 text-muted-foreground" />
          <p className="mt-3 text-[13px] text-foreground/85">No documents found</p>
          <p className="mt-1 max-w-[46ch] text-[11.5px] leading-relaxed text-muted-foreground">
            No document matches the current search and filters.
          </p>
        </div>
      ) : null}
    </div>
  );
}

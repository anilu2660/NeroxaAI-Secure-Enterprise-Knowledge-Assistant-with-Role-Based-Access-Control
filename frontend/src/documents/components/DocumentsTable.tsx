import { Link } from "@tanstack/react-router";
import { Eye, FileText, Globe, Lock, Loader2, RefreshCw } from "lucide-react";
import type { DocumentRecord } from "@/api/types";
import { cn } from "@/shared/utils/utils";

const typeTone: Record<string, string> = {
  Policy: "border-primary/30 bg-primary/10 text-primary",
  SOP: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Handbook: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Specification: "border-border bg-secondary text-foreground",
  Runbook: "border-amber-500/30 bg-amber-500/10 text-amber-400",
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
  onReindex,
  reindexingId,
}: {
  documents: DocumentRecord[];
  /** Ids outside the current session's configured scope (frontend model only). */
  restrictedIds: Set<string>;
  onReindex?: (doc: DocumentRecord) => void;
  reindexingId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
      <div className="max-h-[560px] overflow-y-auto overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="sticky top-0 z-20 hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_90px] gap-3 border-b border-border bg-secondary/50 px-4 py-2.5 text-[10.5px] font-mono font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-md lg:grid">
            <span>Document Name</span>
            <span>Department</span>
            <span>Type</span>
            <span>Access Scope</span>
            <span>Last Updated</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-border">
            {documents.map((doc) => {
              const restricted = restrictedIds.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-1 gap-2.5 px-4 py-3 transition-colors hover:bg-secondary/30 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_90px] lg:items-center lg:gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[6px] border border-border bg-secondary/40 text-[10px] font-mono font-bold text-foreground">
                      {doc.kind}
                    </span>
                    <div className="min-w-0">
                      <Link
                        to="/documents/$documentId"
                        params={{ documentId: doc.id }}
                        className="block truncate font-display text-[13px] font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                      <span className="block truncate text-[11px] text-muted-foreground mt-0.5">
                        {doc.description}
                      </span>
                    </div>
                  </div>

                  <span className="truncate text-[12.5px] font-medium text-foreground">
                    {doc.department}
                  </span>

                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-[4px] border px-2 py-0.5 text-[10.5px] font-medium",
                        typeTone[doc.documentType] ??
                          "border-border bg-secondary/50 text-foreground/80",
                      )}
                    >
                      {doc.documentType}
                    </span>
                  </div>

                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[11px] font-medium",
                        doc.accessRestricted
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                      )}
                    >
                      {doc.accessRestricted ? (
                        <Lock className="size-3" />
                      ) : (
                        <Globe className="size-3" />
                      )}
                      {doc.accessScope}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[9.5px] font-mono font-bold text-foreground">
                      {initials(doc.updatedBy)}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-foreground">
                        {doc.updatedLabel}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        by {doc.updatedBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-start lg:justify-end">
                    {onReindex && !restricted ? (
                      <button
                        type="button"
                        onClick={() => onReindex(doc)}
                        disabled={reindexingId === doc.id}
                        aria-label={`Re-index ${doc.title}`}
                        title="Re-index document (re-parse & update vector store)"
                        className="grid size-7 place-items-center rounded-[6px] border border-border bg-secondary/30 text-foreground hover:bg-secondary hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {reindexingId === doc.id ? (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : (
                          <RefreshCw className="size-3.5" />
                        )}
                      </button>
                    ) : null}

                    {restricted ? (
                      <span
                        className="grid size-7 place-items-center rounded-[6px] border border-border bg-secondary/20 text-muted-foreground"
                        title="Outside your configured access scope"
                      >
                        <Lock className="size-3.5" />
                      </span>
                    ) : (
                      <Link
                        to="/documents/$documentId"
                        params={{ documentId: doc.id }}
                        aria-label={`Open ${doc.title}`}
                        title="Open document details"
                        className="grid size-7 place-items-center rounded-[6px] border border-border bg-secondary/30 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                      >
                        <Eye className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {documents.length === 0 ? (
            <div className="grid place-items-center px-6 py-12 text-center">
              <FileText className="size-6 text-muted-foreground" />
              <p className="mt-3 text-[13px] font-semibold text-foreground">No documents found</p>
              <p className="mt-1 max-w-[46ch] text-[11.5px] leading-relaxed text-muted-foreground">
                No document matches the current search and filters.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

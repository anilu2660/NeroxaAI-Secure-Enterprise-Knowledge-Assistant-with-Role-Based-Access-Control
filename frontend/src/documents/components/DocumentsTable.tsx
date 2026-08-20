import { Link } from "@tanstack/react-router";
import { Eye, FileText, Globe, Lock, Loader2, RefreshCw } from "lucide-react";
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
    <div className="overflow-hidden rounded-3xl border border-hairline bg-card/60 shadow-xl backdrop-blur-2xl transition-all">
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-secondary/20">
        <div className="min-w-[860px]">
          <div className="sticky top-0 z-20 hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_100px] gap-3 border-b border-hairline/80 bg-card/95 px-5 py-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-2xl lg:grid">
            <span>Document Name</span>
            <span>Department</span>
            <span>Type</span>
            <span>Access Scope</span>
            <span>Last Updated</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-hairline/60">
        {documents.map((doc) => {
          const restricted = restrictedIds.has(doc.id);
          return (
            <div
              key={doc.id}
              className="grid grid-cols-1 gap-2.5 px-5 py-3.5 transition-all duration-200 hover:bg-secondary/40 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_100px] lg:items-center lg:gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary shadow-xs">
                  {doc.kind}
                </span>
                <span className="min-w-0">
                  <Link
                    to="/documents/$documentId"
                    params={{ documentId: doc.id }}
                    className="block truncate font-display text-[13.5px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                  >
                    {doc.title}
                  </Link>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {doc.description}
                  </span>
                </span>
              </div>

              <span className="truncate text-[13px] font-medium text-foreground/90">{doc.department}</span>

              <div>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide",
                    typeTone[doc.documentType] ??
                      "border-hairline bg-secondary/50 text-foreground/80",
                  )}
                >
                  {doc.documentType}
                </span>
              </div>

              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-xs",
                    doc.accessRestricted
                      ? "border-amber-500/35 bg-amber-500/15 text-amber-400"
                      : "border-primary/35 bg-primary/15 text-primary",
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

              <div className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/15 text-[10px] font-semibold text-primary">
                  {initials(doc.updatedBy)}
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-foreground">
                    {doc.updatedLabel}
                  </span>
                  <span className="block truncate text-[10.5px] text-muted-foreground">
                    by {doc.updatedBy}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-start lg:justify-end">
                {onReindex && !restricted ? (
                  <button
                    type="button"
                    onClick={() => onReindex(doc)}
                    disabled={reindexingId === doc.id}
                    aria-label={`Re-index ${doc.title}`}
                    title="Re-index document (re-parse & update vector store)"
                    className="grid size-8.5 place-items-center rounded-xl border border-hairline bg-secondary/40 text-foreground/80 transition-all hover:bg-primary/20 hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary disabled:opacity-50 shadow-xs"
                  >
                    {reindexingId === doc.id ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                  </button>
                ) : null}

                {restricted ? (
                  <span
                    className="grid size-8.5 place-items-center rounded-xl border border-hairline bg-secondary/30 text-muted-foreground/70"
                    title="Outside your configured access scope"
                  >
                    <Lock className="size-4" />
                  </span>
                ) : (
                  <Link
                    to="/documents/$documentId"
                    params={{ documentId: doc.id }}
                    aria-label={`Open ${doc.title}`}
                    title="Open document details"
                    className="grid size-8.5 place-items-center rounded-xl border border-hairline bg-secondary/40 text-foreground/80 transition-all hover:bg-primary/20 hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary shadow-xs"
                  >
                    <Eye className="size-4" />
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
          <p className="mt-3 text-[13.5px] font-semibold text-foreground">No documents found</p>
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

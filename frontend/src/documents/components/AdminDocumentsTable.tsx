import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  SquarePen,
  Trash2,
} from "lucide-react";
import type { AdminDocument } from "@/api/types";
import { AccessScopeBadge, DocumentStatusBadge, DocumentTypeBadge } from "./DocumentBadges";

const gridCols =
  "lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_152px]";

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/75 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** Administrative action menu. Every entry raises to the page's service calls. */
function MoreActionsMenu({
  document,
  onReindex,
  onEditMetadata,
  onChangeScope,
  onToggleArchive,
  onDelete,
  onAudit,
}: {
  document: AdminDocument;
  onReindex?: (() => void) | undefined;
  onEditMetadata: () => void;
  onChangeScope: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onAudit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-foreground/85 transition-colors hover:bg-accent/70 hover:text-foreground";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`More actions for ${document.name}`}
        aria-expanded={open}
        title="More actions"
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/75 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
      >
        <MoreHorizontal className="size-3.5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-30 w-[214px] rounded-xl border border-hairline bg-popover/95 p-1 shadow-menu backdrop-blur-xl">
          {onReindex ? (
            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                onReindex();
              }}
            >
              <RefreshCw className="size-3.5 text-primary" /> Re-index vector chunks
            </button>
          ) : null}
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onEditMetadata();
            }}
          >
            <SquarePen className="size-3.5" /> Edit metadata
          </button>
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onChangeScope();
            }}
          >
            <ShieldCheck className="size-3.5" /> Change access scope
          </button>
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onToggleArchive();
            }}
          >
            {document.status === "archived" ? (
              <>
                <ArchiveRestore className="size-3.5" /> Restore document
              </>
            ) : (
              <>
                <Archive className="size-3.5" /> Archive document
              </>
            )}
          </button>
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onAudit();
            }}
          >
            <ScrollText className="size-3.5" /> Open audit logs
          </button>
          <div className="my-1 h-px bg-hairline" />
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="size-3.5" /> Delete document
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Presentation-only repository table with sliding viewport and sticky header.
 */
export function AdminDocumentsTable({
  documents,
  onView,
  onDetails,
  onReindex,
  onEditMetadata,
  onChangeScope,
  onToggleArchive,
  onDelete,
  onAudit,
  reindexingId,
}: {
  documents: AdminDocument[];
  onView: (doc: AdminDocument) => void;
  onDetails: (doc: AdminDocument) => void;
  onReindex?: (doc: AdminDocument) => void;
  onEditMetadata: (doc: AdminDocument) => void;
  onChangeScope: (doc: AdminDocument) => void;
  onToggleArchive: (doc: AdminDocument) => void;
  onDelete: (doc: AdminDocument) => void;
  onAudit: (doc: AdminDocument) => void;
  reindexingId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-card/60 shadow-xl backdrop-blur-2xl transition-all">
      {/* Scrollable / Sliding Viewport */}
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-secondary/20">
        <div className="min-w-[920px]">
          {/* Sticky Table Header */}
          <div
            className={`sticky top-0 z-20 grid gap-3 border-b border-hairline/80 bg-card/95 px-5 py-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-2xl ${gridCols}`}
          >
            <span>Document Name</span>
            <span>Department</span>
            <span>Type</span>
            <span>Access Scope</span>
            <span>Status</span>
            <span>Last Updated</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-hairline/60">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`grid grid-cols-1 gap-2.5 px-5 py-3.5 transition-all duration-200 hover:bg-primary/[0.03] lg:items-center lg:gap-3 ${gridCols}`}
              >
                {/* Document Name & Desc */}
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl border border-rose-500/35 bg-rose-500/10 text-rose-400 shadow-xs">
                    <FileText className="size-4.5" />
                    <span className="sr-only">{doc.fileKind}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onView(doc)}
                      className="block max-w-full truncate text-left font-display text-[13px] font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
                    >
                      {doc.name}
                    </button>
                    <span className="block truncate text-[11px] leading-relaxed text-muted-foreground">
                      {doc.description}
                    </span>
                  </div>
                </div>

                {/* Department */}
                <div className="truncate text-[12px] font-medium text-foreground/90">
                  {doc.department}
                </div>

                {/* Type */}
                <div>
                  <DocumentTypeBadge type={doc.documentType} />
                </div>

                {/* Scope */}
                <div>
                  <AccessScopeBadge kind={doc.accessScopeKind} label={doc.accessScopeLabel} />
                </div>

                {/* Status */}
                <div>
                  <DocumentStatusBadge status={doc.status} />
                </div>

                {/* Last Updated */}
                <div className="text-[11.5px] leading-tight text-muted-foreground">
                  {doc.updatedDateLabel ? (
                    <>
                      <span className="block font-medium text-foreground/80">
                        {doc.updatedDateLabel}
                      </span>
                      {doc.updatedTimeLabel ? (
                        <span className="block text-[10.5px] text-muted-foreground/80">
                          {doc.updatedTimeLabel}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "Unavailable"
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 lg:justify-end">
                  {onReindex ? (
                    <IconButton
                      label={`Re-index ${doc.name}`}
                      onClick={() => onReindex(doc)}
                      disabled={reindexingId === doc.id}
                    >
                      {reindexingId === doc.id ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <RefreshCw className="size-4 text-primary" />
                      )}
                    </IconButton>
                  ) : null}
                  <IconButton label={`View ${doc.name}`} onClick={() => onView(doc)}>
                    <Eye className="size-4" />
                  </IconButton>
                  <IconButton label={`Details for ${doc.name}`} onClick={() => onDetails(doc)}>
                    <FileText className="size-4" />
                  </IconButton>
                  <IconButton label={`Delete ${doc.name}`} onClick={() => onDelete(doc)}>
                    <Trash2 className="size-4 text-destructive" />
                  </IconButton>
                  <MoreActionsMenu
                    document={doc}
                    onReindex={onReindex ? () => onReindex(doc) : undefined}
                    onEditMetadata={() => onEditMetadata(doc)}
                    onChangeScope={() => onChangeScope(doc)}
                    onToggleArchive={() => onToggleArchive(doc)}
                    onDelete={() => onDelete(doc)}
                    onAudit={() => onAudit(doc)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Eye,
  FileText,
  MoreHorizontal,
  ScrollText,
  ShieldCheck,
  SquarePen,
  Trash2,
} from "lucide-react";
import type { AdminDocument } from "@/api/types";
import { AccessScopeBadge, DocumentStatusBadge, DocumentTypeBadge } from "./DocumentBadges";

const gridCols =
  "lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_128px]";

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/75 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}

/** Administrative action menu. Every entry raises to the page's service calls. */
function MoreActionsMenu({
  document,
  onEditMetadata,
  onChangeScope,
  onToggleArchive,
  onDelete,
  onAudit,
}: {
  document: AdminDocument;
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
        <div className="absolute right-0 top-8 z-30 w-[204px] rounded-xl border border-hairline bg-popover/95 p-1 shadow-menu backdrop-blur-xl">
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
 * Presentation-only repository table. No component mutates data — actions are
 * raised to the page, which calls the service boundary.
 */
export function AdminDocumentsTable({
  documents,
  onView,
  onDetails,
  onEditMetadata,
  onChangeScope,
  onToggleArchive,
  onDelete,
  onAudit,
}: {
  documents: AdminDocument[];
  onView: (doc: AdminDocument) => void;
  onDetails: (doc: AdminDocument) => void;
  onEditMetadata: (doc: AdminDocument) => void;
  onChangeScope: (doc: AdminDocument) => void;
  onToggleArchive: (doc: AdminDocument) => void;
  onDelete: (doc: AdminDocument) => void;
  onAudit: (doc: AdminDocument) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card/60 backdrop-blur-xl">
      <div
        className={`hidden gap-3 border-b border-hairline px-4 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground lg:grid ${gridCols}`}
      >
        <span>Document Name</span>
        <span>Department</span>
        <span>Type</span>
        <span>Access Scope</span>
        <span>Status</span>
        <span>Last Updated</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-hairline">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`grid grid-cols-1 gap-2 px-4 py-2.5 transition-colors hover:bg-accent/25 lg:items-center lg:gap-3 ${gridCols}`}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-destructive/25 bg-destructive/10">
                <FileText className="size-4 text-destructive" />
                <span className="sr-only">{doc.fileKind}</span>
              </span>
              <span className="min-w-0">
                <button
                  type="button"
                  onClick={() => onView(doc)}
                  className="block max-w-full truncate text-left text-[12.5px] text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
                >
                  {doc.name}
                </button>
                <span className="block text-[11px] leading-[1.35] text-muted-foreground">
                  {doc.description}
                </span>
              </span>
            </div>

            <span className="truncate text-[12px] text-foreground/85">{doc.department}</span>

            <span>
              <DocumentTypeBadge type={doc.documentType} />
            </span>

            <span>
              <AccessScopeBadge kind={doc.accessScopeKind} label={doc.accessScopeLabel} />
            </span>

            <span>
              <DocumentStatusBadge status={doc.status} />
            </span>

            <span className="text-[11.5px] leading-[1.35] text-muted-foreground">
              {doc.updatedDateLabel ? (
                <>
                  <span className="block text-foreground/80">{doc.updatedDateLabel}</span>
                  {doc.updatedTimeLabel ? (
                    <span className="block">{doc.updatedTimeLabel}</span>
                  ) : null}
                </>
              ) : (
                "Unavailable"
              )}
            </span>

            <span className="flex items-center gap-1.5 lg:justify-end">
              <IconButton label={`View ${doc.name}`} onClick={() => onView(doc)}>
                <Eye className="size-3.5" />
              </IconButton>
              <IconButton label={`Details for ${doc.name}`} onClick={() => onDetails(doc)}>
                <FileText className="size-3.5" />
              </IconButton>
              <IconButton label={`Delete ${doc.name}`} onClick={() => onDelete(doc)}>
                <Trash2 className="size-3.5 text-destructive" />
              </IconButton>
              <MoreActionsMenu
                document={doc}
                onEditMetadata={() => onEditMetadata(doc)}
                onChangeScope={() => onChangeScope(doc)}
                onToggleArchive={() => onToggleArchive(doc)}
                onDelete={() => onDelete(doc)}
                onAudit={() => onAudit(doc)}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

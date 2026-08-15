import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import type { AdminDocument, AdminDocumentScopeOption, DocumentRecord } from "@/api/types";
import { ModalShell } from "@/users/components/UserFormDialog";
import { DocumentViewer } from "./DocumentViewer";
import { scopeHint } from "./DocumentBadges";
import { cn } from "@/shared/utils/utils";

const fieldClass =
  "h-9 w-full rounded-xl border border-hairline bg-secondary/35 px-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/75 outline-none transition-colors focus-visible:border-primary/60";

const labelClass = "block text-[11px] text-muted-foreground";

function NotPersistedNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Metadata edit. Storage/index identifiers are backend-owned and not editable. */
export function DocumentMetadataDialog({
  document,
  departments,
  documentTypes,
  submitting,
  onClose,
  onSubmit,
}: {
  document: AdminDocument | null;
  departments: string[];
  documentTypes: string[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (patch: {
    name: string;
    description: string;
    department: string;
    documentType: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) return;
    setName(document.name);
    setDescription(document.description);
    setDepartment(document.department);
    setDocumentType(document.documentType);
    setError(null);
  }, [document]);

  if (!document) return null;

  const submit = () => {
    if (!name.trim()) {
      setError("Document name is required.");
      return;
    }
    setError(null);
    onSubmit({ name, description, department, documentType });
  };

  return (
    <ModalShell
      title="Edit document metadata"
      description="Administrative metadata for this repository record."
      onClose={onClose}
    >
      <div className="space-y-3">
        <label className="space-y-1">
          <span className={labelClass}>Document name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>

        <label className="space-y-1">
          <span className={labelClass}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-hairline bg-secondary/35 px-3 py-2 text-[12.5px] text-foreground outline-none transition-colors focus-visible:border-primary/60"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClass}>Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClass}
            >
              {[...new Set([document.department, ...departments])].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Document type</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className={fieldClass}
            >
              {[...new Set([document.documentType, ...documentTypes])].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <dl className="grid gap-2 rounded-xl border border-hairline bg-secondary/20 px-3 py-2 text-[11px] sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">File kind</dt>
            <dd className="text-foreground/85">{document.fileKind}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pages</dt>
            <dd className="text-foreground/85">{document.pageCount ?? "Unavailable"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Storage reference</dt>
            <dd className="text-foreground/85">{document.storageKey ?? "Unavailable"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Index reference</dt>
            <dd className="text-foreground/85">{document.indexId ?? "Unavailable"}</dd>
          </div>
        </dl>
      </div>

      <NotPersistedNote>
        No document backend is connected, so metadata edits apply to this browser session only.
        Storage and index references stay unavailable because nothing has been stored or indexed.
      </NotPersistedNote>

      {error ? <p className="mt-2 text-[11.5px] text-destructive">{error}</p> : null}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="h-9 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Save metadata
        </button>
      </div>
    </ModalShell>
  );
}

/** Access-scope reassignment. Configuration intent only — nothing is enforced. */
export function DocumentScopeDialog({
  document,
  options,
  submitting,
  onClose,
  onSubmit,
}: {
  document: AdminDocument | null;
  options: AdminDocumentScopeOption[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (option: AdminDocumentScopeOption) => void;
}) {
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (document) setSelected(document.accessScopeLabel);
  }, [document]);

  if (!document) return null;
  const choice = options.find((option) => option.label === selected) ?? options[0]!;

  return (
    <ModalShell
      title="Change access scope"
      description={document.name}
      onClose={onClose}
      width="max-w-[460px]"
    >
      <div role="radiogroup" aria-label="Access scope" className="space-y-2">
        {options.map((option) => {
          const active = option.label === selected;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(option.label)}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-primary/45 bg-primary/10"
                  : "border-hairline bg-secondary/30 hover:bg-accent/50",
              )}
            >
              <span className="block text-[12.5px] text-foreground">{option.label}</span>
              <span className="block text-[11px] text-muted-foreground">
                {scopeHint[option.kind]}
              </span>
            </button>
          );
        })}
      </div>

      <NotPersistedNote>
        Access scope is configuration only. No backend currently enforces RBAC-filtered retrieval,
        so changing it here does not restrict who can reach this document.
      </NotPersistedNote>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit(choice)}
          disabled={submitting}
          className="h-9 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Update scope
        </button>
      </div>
    </ModalShell>
  );
}

import { useQuery } from "@tanstack/react-query";
import { getDocumentPreviewPage } from "@/api/workspace-service";

/** Admin Adobe PDF Viewer Modal for inspecting documents directly inside Admin console. */
export function AdminDocumentViewerDialog({
  document,
  onClose,
}: {
  document: AdminDocument | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [document]);

  const preview = useQuery({
    queryKey: ["document-preview", document?.id, page],
    queryFn: () => getDocumentPreviewPage(document!.id, page),
    enabled: !!document,
  });

  if (!document) return null;

  const docRecord: DocumentRecord = {
    id: document.id,
    title: document.name,
    kind: (document.fileKind?.toUpperCase() as any) || "PDF",
    department: document.department,
    documentType: document.documentType,
    accessScope: document.accessScopeLabel,
    status: document.status === "archived" ? "archived" : "available",
    pageCount: document.pageCount ?? 1,
    description: document.description,
    version: "1.0",
    prototype: document.prototype,
    updatedDateLabel: document.updatedDateLabel ?? undefined,
    rawUrl: `/api/v1/documents/${document.id}/raw`,
  };

  return (
    <ModalShell
      title={`Adobe PDF View · ${document.name}`}
      description={`Department: ${document.department} · Scope: ${document.accessScopeLabel}`}
      onClose={onClose}
      width="max-w-[1100px]"
    >
      <div className="h-[74vh] min-h-[500px]">
        <DocumentViewer
          doc={docRecord}
          page={page}
          preview={preview.data ?? null}
          loading={preview.isLoading}
          citation={null}
          onPageChange={setPage}
        />
      </div>
    </ModalShell>
  );
}

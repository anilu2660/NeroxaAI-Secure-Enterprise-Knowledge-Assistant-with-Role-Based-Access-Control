import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { UploadDropzone } from "@/documents/components/UploadDropzone";
import {
  SecurityAccessContextPanel,
  SupportedFilesPanel,
  UploadWorkflowPanel,
} from "@/documents/components/UploadSidePanels";
import { useAuth } from "@/auth/auth-context";
import type { DocumentFileValidation, DocumentUploadDraft } from "@/api/types";
import {
  getDocumentServiceStatus,
  getDocumentUploadConstraints,
  getDocumentUploadVocabulary,
  getUploadWorkflowStages,
  prepareDocumentUpload,
  submitDocumentUpload,
  validateDocumentFile,
} from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/upload")({
  head: () => ({
    meta: [
      { title: "Upload Document — NeroxaAI Admin" },
      {
        name: "description",
        content:
          "Administrators prepare controlled organizational knowledge sources with department, document type, and access scope metadata.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Upload Document — NeroxaAI Admin" },
      {
        property: "og:description",
        content: "Prepare controlled organizational knowledge sources for the NeroxaAI workspace.",
      },
    ],
  }),
  component: UploadRoute,
});

/** Admin-only: document ingestion is never a USER capability. */
function UploadRoute() {
  return (
    <RoleGuard role="ADMIN" permission="documents:upload">
      <UploadDocumentPage />
    </RoleGuard>
  );
}

const fieldClass =
  "h-9 w-full rounded-xl border border-hairline bg-secondary/35 px-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/75 outline-none transition-colors focus-visible:border-primary/60";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-[11.5px] text-foreground/85">
      {children}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </span>
  );
}

function FieldHint({ error, hint }: { error?: string | undefined; hint: string }) {
  return (
    <span
      className={
        error ? "block text-[11px] text-destructive" : "block text-[11px] text-muted-foreground"
      }
    >
      {error ?? hint}
    </span>
  );
}

type NoticeState =
  | { kind: "none" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function UploadDocumentPage() {
  const { session } = useAuth();
  const admin = session?.user ?? null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const constraints = getDocumentUploadConstraints();
  const workflow = getUploadWorkflowStages();
  const vocabulary = getDocumentUploadVocabulary();

  const serviceStatus = useQuery({
    queryKey: ["document-service-status"],
    queryFn: getDocumentServiceStatus,
    refetchInterval: 30_000,
  });

  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<DocumentFileValidation | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [notice, setNotice] = useState<NoticeState>({ kind: "none" });
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<DocumentUploadDraft>({
    name: "",
    department: "",
    documentType: "",
    accessScopeLabel: "",
    description: "",
  });

  const preparation = useMemo(
    () => prepareDocumentUpload({ draft, file, admin }),
    [draft, file, admin],
  );

  const status = serviceStatus.data ?? null;
  const serviceConnected = status?.state === "connected";
  const canSubmit = preparation.ready && serviceConnected && !uploading;

  const update = <K extends keyof DocumentUploadDraft>(key: K, value: DocumentUploadDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice({ kind: "none" });
  };

  const selectFile = (next: File) => {
    const result = validateDocumentFile(next);
    setFile(next);
    setValidation(result);
    setNotice({ kind: "none" });
    // Suggest a document name from the filename; fully editable afterwards.
    if (result.valid && !draft.name.trim()) {
      const base = next.name
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
      if (base) update("name", base);
    }
  };

  const clearFile = () => {
    setFile(null);
    setValidation(null);
    setNotice({ kind: "none" });
  };

  const resetForm = () => {
    setFile(null);
    setValidation(null);
    setShowErrors(false);
    setDraft({
      name: "",
      department: "",
      documentType: "",
      accessScopeLabel: "",
      description: "",
    });
  };

  /** Upload document to backend and index into knowledge base. */
  const submit = async () => {
    setShowErrors(true);
    if (!preparation.ready || !preparation.payload || !file) return;

    setUploading(true);
    setNotice({ kind: "none" });

    try {
      const result = await submitDocumentUpload(preparation.payload, file);
      if (result.accepted) {
        setNotice({ kind: "success", message: result.message });
        void queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-document-filters"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-document-overview"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
        void queryClient.invalidateQueries({ queryKey: ["documents"] });
        void queryClient.invalidateQueries({ queryKey: ["document-filter-options"] });
        void queryClient.invalidateQueries({ queryKey: ["recent-documents"] });
        void queryClient.invalidateQueries({ queryKey: ["knowledge-overview"] });
        resetForm();
      } else {
        setNotice({ kind: "error", message: result.message });
      }
    } catch (err: any) {
      setNotice({ kind: "error", message: err?.message || "An unexpected error occurred." });
    } finally {
      setUploading(false);
    }
  };

  const errors = showErrors ? preparation.fieldErrors : {};

  return (
    <section className="space-y-3.5 pt-1">
      <header className="flex items-start gap-3">
        <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/12">
          <UploadCloud className="size-5 text-primary" />
        </span>
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Link to="/admin" className="transition-colors hover:text-foreground">
              Admin Dashboard
            </Link>
            <ChevronRight className="size-3" />
            <Link to="/admin/documents" className="transition-colors hover:text-foreground">
              Document Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground/80">Upload Document</span>
          </nav>
          <h1 className="mt-1 font-display text-[27px] font-medium tracking-tight text-foreground">
            Upload Document
          </h1>
          <p className="mt-0.5 max-w-[620px] text-[12.5px] leading-relaxed text-muted-foreground">
            Add documents to the organizational knowledge base. Uploaded files are parsed, chunked,
            embedded, and indexed into Qdrant so employees can query them via the assistant
            {admin ? ` · prepared by ${admin.name}, ${admin.department}` : ""}.
          </p>
        </div>
      </header>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_318px] xl:items-start">
        <div className="space-y-3.5">
          <UploadDropzone
            constraints={constraints}
            file={file}
            validation={validation}
            onSelect={selectFile}
            onClear={clearFile}
          />

          <div className="rounded-2xl border border-hairline bg-card/60 p-3.5 backdrop-blur-xl">
            <div className="grid gap-3 lg:grid-cols-3">
              <label className="space-y-1">
                <FieldLabel required>Document Name</FieldLabel>
                <input
                  value={draft.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="e.g. Information Security Policy"
                  maxLength={160}
                  className={fieldClass}
                />
                <FieldHint error={errors.name} hint="A clear, searchable name for this document." />
              </label>

              <label className="space-y-1">
                <FieldLabel required>Department</FieldLabel>
                <select
                  value={draft.department}
                  onChange={(event) => update("department", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select department</option>
                  {vocabulary.departments.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <FieldHint
                  error={errors.department}
                  hint="Owning department responsible for this document."
                />
              </label>

              <label className="space-y-1">
                <FieldLabel required>Document Type</FieldLabel>
                <select
                  value={draft.documentType}
                  onChange={(event) => update("documentType", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select type</option>
                  {vocabulary.documentTypes.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <FieldHint error={errors.documentType} hint="Type of document being prepared." />
              </label>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <label className="space-y-1">
                <FieldLabel>Access Scope (Optional)</FieldLabel>
                <select
                  value={draft.accessScopeLabel}
                  onChange={(event) => update("accessScopeLabel", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Auto (based on department)</option>
                  {vocabulary.accessScopes.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldHint
                  error={errors.accessScopeLabel}
                  hint="Retrieval visibility scope. Defaults to department scope."
                />
              </label>

              <label className="space-y-1 lg:col-span-2">
                <FieldLabel>Description (Optional)</FieldLabel>
                <textarea
                  value={draft.description}
                  onChange={(event) => update("description", event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Purpose, summary, or additional notes."
                  className="w-full resize-none rounded-xl border border-hairline bg-secondary/35 px-3 py-2 text-[12.5px] text-foreground placeholder:text-muted-foreground/75 outline-none transition-colors focus-visible:border-primary/60"
                />
                <FieldHint
                  error={errors.description}
                  hint="Optional purpose, summary, or additional notes."
                />
              </label>
            </div>

            {/* Backend Status Banner */}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-3">
              <div className="flex min-w-0 gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400/90" />
                <div className="min-w-0">
                  <p className="text-[12.5px] text-foreground">
                    Backend Status:{" "}
                    <span className={serviceConnected ? "text-emerald-400" : "text-amber-300/90"}>
                      {status ? status.label : "Checking document service…"}
                    </span>
                  </p>
                  <p className="mt-0.5 max-w-[520px] text-[11.5px] leading-relaxed text-muted-foreground">
                    {status
                      ? status.detail
                      : "The document service state has not been reported yet."}
                  </p>
                </div>
              </div>
              <Link
                to="/admin/documents"
                className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12px] text-foreground/85 transition-colors hover:bg-accent/60"
              >
                Document Management
                <ExternalLink className="size-3.5" />
              </Link>
            </div>

            {/* Upload result notice */}
            {notice.kind !== "none" ? (
              <div
                className={`mt-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12px] leading-relaxed ${
                  notice.kind === "success"
                    ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300"
                    : "border-destructive/30 bg-destructive/[0.07] text-destructive"
                }`}
              >
                {notice.kind === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0" />
                )}
                <span>{notice.message}</span>
              </div>
            ) : null}

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-hairline pt-3.5">
              <button
                type="button"
                onClick={() => navigate({ to: "/admin/documents" })}
                className="h-10 rounded-xl border border-hairline bg-secondary/40 px-4 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
              >
                Cancel
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                {!preparation.ready && showErrors && (
                  <p className="max-w-[320px] text-[11px] leading-relaxed text-muted-foreground">
                    {!file
                      ? "Select a valid file to continue."
                      : "Complete all required fields above."}
                  </p>
                )}
                {preparation.ready && !serviceConnected && (
                  <p className="max-w-[320px] text-[11px] leading-relaxed text-amber-400/80">
                    Document service not connected. Start the backend server to enable uploads.
                  </p>
                )}
                <button
                  id="upload-document-btn"
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  title={
                    !preparation.ready
                      ? "Complete required fields and select a valid file"
                      : !serviceConnected
                        ? "Document service not connected — start the backend to enable uploads"
                        : uploading
                          ? "Uploading…"
                          : "Upload and index this document into the knowledge base"
                  }
                  className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-secondary/50 disabled:text-muted-foreground disabled:opacity-100"
                >
                  <UploadCloud className="size-4" />
                  {uploading ? "Uploading…" : "Upload to Knowledge Base"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3.5">
          <SecurityAccessContextPanel
            department={draft.department}
            accessScopeLabel={draft.accessScopeLabel}
          />
          <SupportedFilesPanel constraints={constraints} />
          {status ? <UploadWorkflowPanel stages={workflow} serviceStatus={status} /> : null}
        </aside>
      </div>
    </section>
  );
}

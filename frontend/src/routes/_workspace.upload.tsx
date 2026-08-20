import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, ExternalLink, UploadCloud, XCircle, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { UploadDropzone } from "@/documents/components/UploadDropzone";
import { SecurityAccessContextPanel, SupportedFilesPanel, UploadWorkflowPanel } from "@/documents/components/UploadSidePanels";
import { useAuth } from "@/auth/auth-context";
import type { DocumentFileValidation, DocumentUploadDraft } from "@/api/types";
import { getDocumentServiceStatus, getDocumentUploadConstraints, getDocumentUploadVocabulary, getUploadWorkflowStages, prepareDocumentUpload, submitDocumentUpload, validateDocumentFile } from "@/api/workspace-service";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusPill } from "@/shared/components/ui/status-pill";

export const Route = createFileRoute("/_workspace/upload")({ head: () => ({ meta: [{ title: "Upload Document — NeroxaAI" }, { name: "description", content: "Controlled enterprise document ingestion with access metadata." }, { name: "robots", content: "noindex" }] }), component: UploadRoute });
function UploadRoute() { return <RoleGuard permission="documents:upload"><UploadDocumentPage /></RoleGuard>; }
const fieldClass =
  "h-10.5 w-full rounded-2xl border border-hairline bg-secondary/30 px-3.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-all hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring shadow-xs";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </span>
  );
}

function FieldHint({ error, hint }: { error?: string | undefined; hint: string }) {
  return (
    <span
      className={
        error ? "block text-[11px] font-medium text-destructive" : "block text-[11px] text-muted-foreground"
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
    refetchInterval: 30000,
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
    if (result.valid && !draft.name.trim()) {
      const base = next.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
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
    setDraft({ name: "", department: "", documentType: "", accessScopeLabel: "", description: "" });
  };

  const submit = async () => {
    setShowErrors(true);
    if (!preparation.ready || !preparation.payload || !file) return;
    setUploading(true);
    setNotice({ kind: "none" });
    try {
      const result = await submitDocumentUpload(preparation.payload, file);
      if (result.accepted) {
        setNotice({ kind: "success", message: result.message });
        window.dispatchEvent(
          new CustomEvent("neroxa:document_ingested", {
            detail: { docName: draft.name || file.name, dept: draft.department },
          }),
        );
        for (const key of [
          "admin-documents",
          "admin-document-filters",
          "admin-document-overview",
          "admin-metrics",
          "documents",
          "document-filter-options",
          "recent-documents",
          "knowledge-overview",
        ])
          void queryClient.invalidateQueries({ queryKey: [key] });
        resetForm();
      } else setNotice({ kind: "error", message: result.message });
    } catch (err: any) {
      setNotice({ kind: "error", message: err?.message || "An unexpected error occurred." });
    } finally {
      setUploading(false);
    }
  };

  const errors = showErrors ? preparation.fieldErrors : {};

  return (
    <div className="space-y-6 pb-6 pt-1">
      <PageHeader
        eyebrow="Controlled ingestion"
        title="Upload document"
        description="Prepare an enterprise knowledge source with ownership, document type, and retrieval access scope before indexing."
        actions={
          <StatusPill tone="accent" icon={<ShieldCheck className="size-3.5" />}>
            Admin ingestion
          </StatusPill>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-5">
          {/* Step 1: Select Source */}
          <section className="rounded-3xl border border-hairline bg-card/60 p-6 shadow-xl backdrop-blur-2xl transition-all">
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-hairline/80">
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">
                  1. Select source
                </h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Upload a supported file for vector chunking &amp; ingestion.
                </p>
              </div>
              <StatusPill tone={validation?.valid ? "success" : "neutral"}>
                {file ? (validation?.valid ? "Validated" : "Needs attention") : "Waiting for file"}
              </StatusPill>
            </div>
            <UploadDropzone
              constraints={constraints}
              file={file}
              validation={validation}
              onSelect={selectFile}
              onClear={clearFile}
            />
          </section>

          {/* Step 2: Define Knowledge Metadata */}
          <section className="rounded-3xl border border-hairline bg-card/60 p-6 shadow-xl backdrop-blur-2xl transition-all">
            <div className="mb-4 pb-3 border-b border-hairline/80">
              <h2 className="font-display text-sm font-semibold text-foreground">
                2. Define knowledge metadata
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                These fields control RBAC vector filtering and retrieval visibility.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <FieldLabel required>Document name</FieldLabel>
                <input
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Information Security Policy"
                  maxLength={160}
                  className={fieldClass}
                />
                <FieldHint error={errors.name} hint="Searchable title." />
              </label>

              <label className="space-y-1.5">
                <FieldLabel required>Department</FieldLabel>
                <select
                  value={draft.department}
                  onChange={(e) => update("department", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select department</option>
                  {vocabulary.departments.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldHint error={errors.department} hint="Owning department." />
              </label>

              <label className="space-y-1.5">
                <FieldLabel required>Document type</FieldLabel>
                <select
                  value={draft.documentType}
                  onChange={(e) => update("documentType", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select type</option>
                  {vocabulary.documentTypes.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldHint error={errors.documentType} hint="Knowledge source type." />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <FieldLabel>Access scope</FieldLabel>
                <select
                  value={draft.accessScopeLabel}
                  onChange={(e) => update("accessScopeLabel", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Auto · department scope</option>
                  {vocabulary.accessScopes.map((v) => (
                    <option key={v.label} value={v.label}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <FieldHint error={errors.accessScopeLabel} hint="Retrieval audience." />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Purpose or summary for administrators."
                  className="w-full resize-none rounded-2xl border border-hairline bg-secondary/30 px-3.5 py-2.5 text-[12.5px] outline-none transition-all placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring shadow-xs"
                />
                <FieldHint error={errors.description} hint="Administrative context &amp; summary." />
              </label>
            </div>
          </section>

          {/* Step 3: Validate & Index */}
          <section className="rounded-3xl border border-hairline bg-card/60 p-6 shadow-xl backdrop-blur-2xl transition-all">
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-hairline/80">
              <div>
                <h2 className="font-display text-sm font-semibold">3. Validate &amp; index</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Files are parsed, chunked, embedded, and indexed into Qdrant.
                </p>
              </div>
              <StatusPill tone={serviceConnected ? "success" : "warning"}>
                {status?.label ?? "Checking service"}
              </StatusPill>
            </div>

            {notice.kind !== "none" ? (
              <div
                className={`mb-4 flex items-start gap-2.5 rounded-2xl border p-3.5 text-[12px] shadow-sm backdrop-blur-md ${
                  notice.kind === "success"
                    ? "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-300"
                    : "border-destructive/40 bg-destructive/[0.08] text-destructive"
                }`}
              >
                {notice.kind === "success" ? (
                  <CheckCircle2 className="size-4.5 shrink-0" />
                ) : (
                  <XCircle className="size-4.5 shrink-0" />
                )}
                <span>{notice.message}</span>
              </div>
            ) : null}

            {!serviceConnected ? (
              <div className="mb-4 flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-3.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  {status?.detail ?? "The document service has not reported a connected state yet."}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate({ to: "/admin/documents" })}
                className="h-10 rounded-2xl border border-hairline bg-secondary/40 px-4 text-[12px] font-medium text-foreground transition-all hover:bg-secondary/70"
              >
                Cancel
              </button>
              <button
                id="upload-document-btn"
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] px-6 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:bg-[position:right_center] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                <UploadCloud className="size-4" />
                {uploading ? "Indexing into Qdrant…" : "Upload & index"}
              </button>
            </div>
          </section>
        </div>

        {/* Aside Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-[4.5rem]">
          <SecurityAccessContextPanel
            department={draft.department}
            accessScopeLabel={draft.accessScopeLabel}
          />
          <SupportedFilesPanel constraints={constraints} />
          <UploadWorkflowPanel stages={workflow} serviceStatus={status} />
        </aside>
      </div>
    </div>
  );
}

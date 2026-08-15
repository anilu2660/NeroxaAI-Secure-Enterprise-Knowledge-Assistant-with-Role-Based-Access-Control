import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronRight,
  Download,
  FolderCog,
  FolderOpen,
  RotateCcw,
  Search,
  UploadCloud,
} from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { AdminDocumentsTable } from "@/documents/components/AdminDocumentsTable";
import {
  AdminDocumentViewerDialog,
  DocumentMetadataDialog,
  DocumentScopeDialog,
} from "@/documents/components/DocumentAdminDialogs";
import { ConfirmActionDialog } from "@/shared/components/admin/ConfirmActionDialog";
import { documentStatusLabel } from "@/documents/components/DocumentBadges";
import { useAuth } from "@/auth/auth-context";
import type { AdminDocument, AdminDocumentScopeOption, AdminDocumentStatus } from "@/api/types";
import {
  buildAdminDocumentCsv,
  deleteAdminDocument,
  getAdminDocumentFilterOptions,
  getAdminDocumentScopeOptions,
  listAdminDocuments,
  setAdminDocumentAccessScope,
  setAdminDocumentStatus,
  updateAdminDocumentMetadata,
} from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/admin/documents")({
  head: () => ({
    meta: [
      { title: "Document Management — NeroxaAI Admin" },
      {
        name: "description",
        content:
          "Administrators manage organizational documents, access scopes, metadata, and knowledge sources across the NeroxaAI repository.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Document Management — NeroxaAI Admin" },
      {
        property: "og:description",
        content: "Manage organizational documents, access scopes, metadata, and knowledge sources.",
      },
    ],
  }),
  component: DocumentManagementRoute,
});

function DocumentManagementRoute() {
  return (
    <RoleGuard role="ADMIN" permission="documents:upload">
      <DocumentManagementPage />
    </RoleGuard>
  );
}

const selectClass =
  "h-9 w-full rounded-xl border border-hairline bg-secondary/35 px-2.5 text-[12px] text-foreground/90 outline-none transition-colors hover:bg-accent/40 focus-visible:border-primary/60";

type DialogState =
  | { kind: "none" }
  | { kind: "view"; doc: AdminDocument }
  | { kind: "metadata"; doc: AdminDocument }
  | { kind: "scope"; doc: AdminDocument }
  | { kind: "archive"; doc: AdminDocument }
  | { kind: "delete"; doc: AdminDocument };

function DocumentManagementPage() {
  const { session } = useAuth();
  const admin = session?.user ?? null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [accessScope, setAccessScope] = useState("");
  const [status, setStatus] = useState<AdminDocumentStatus | "">("");
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [notice, setNotice] = useState<string | null>(null);

  const filters = useQuery({
    queryKey: ["admin-document-filters"],
    queryFn: getAdminDocumentFilterOptions,
  });

  const documents = useQuery({
    queryKey: ["admin-documents", search, department, documentType, accessScope, status],
    queryFn: () => listAdminDocuments({ search, department, documentType, accessScope, status }),
  });

  const rows = documents.data ?? [];
  const hasFilters = !!(search || department || documentType || accessScope || status);

  const refresh = (message: string) => {
    setNotice(message);
    void queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-document-filters"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-document-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    // The user-facing library, dashboard panels, and detail page project the
    // SAME canonical record, so they must refetch after any admin edit.
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
    void queryClient.invalidateQueries({ queryKey: ["document-filter-options"] });
    void queryClient.invalidateQueries({ queryKey: ["recent-documents"] });
    void queryClient.invalidateQueries({ queryKey: ["knowledge-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["document"] });
    setDialog({ kind: "none" });
  };

  const editMetadata = useMutation({
    mutationFn: (input: {
      id: string;
      patch: { name: string; description: string; department: string; documentType: string };
    }) => updateAdminDocumentMetadata(input.id, input.patch),
    onSuccess: (result) => refresh(result.message),
  });
  const changeScope = useMutation({
    mutationFn: (input: { id: string; scope: AdminDocumentScopeOption }) =>
      setAdminDocumentAccessScope(input.id, input.scope),
    onSuccess: (result) => refresh(result.message),
  });
  const changeStatus = useMutation({
    mutationFn: (input: { id: string; status: AdminDocumentStatus }) =>
      setAdminDocumentStatus(input.id, input.status),
    onSuccess: (result) => refresh(result.message),
  });
  const removeDocument = useMutation({
    mutationFn: (id: string) => deleteAdminDocument(id),
    onSuccess: (result) => {
      if (result.persisted) {
        refresh(result.message);
      } else {
        // Backend returned an error; show it without closing the dialog
        setNotice(result.message);
        setDialog({ kind: "none" });
        void queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      }
    },
    onError: (err: any) => {
      setNotice(`Delete failed: ${err?.message || "Unknown error"}`);
      setDialog({ kind: "none" });
    },
  });

  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setDocumentType("");
    setAccessScope("");
    setStatus("");
  };

  /** Exports exactly the rows the service returned — nothing is fabricated. */
  const exportList = () => {
    const csv = buildAdminDocumentCsv(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "neroxaai-documents.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(
      `Exported ${rows.length} listed record${rows.length === 1 ? "" : "s"} from this view.`,
    );
  };

  return (
    <section className="space-y-3.5 pt-1">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/12">
            <FolderCog className="size-5 text-primary" />
          </span>
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Link to="/admin" className="transition-colors hover:text-foreground">
                Admin Dashboard
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground/80">Document Management</span>
            </nav>
            <h1 className="mt-1 font-display text-[27px] font-medium tracking-tight text-foreground">
              Document Management
            </h1>
            <p className="mt-0.5 max-w-[640px] text-[12.5px] leading-relaxed text-muted-foreground">
              Manage organizational documents, access scopes, metadata, and knowledge sources
              {admin ? ` · ${admin.name}, ${admin.department}` : ""}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportList}
            disabled={rows.length === 0}
            title={
              rows.length === 0
                ? "Nothing to export — no records are available from the document service"
                : "Export the currently listed records as CSV"
            }
            className="flex h-10 items-center gap-2 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-40"
          >
            <Download className="size-4" />
            Export List
          </button>
          <Link
            to="/upload"
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UploadCloud className="size-4" />
            Upload Document
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-hairline bg-card/60 p-3 backdrop-blur-xl">
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents by name or content..."
              aria-label="Search documents"
              className="h-9 w-full rounded-xl border border-hairline bg-secondary/35 pl-9 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/80 outline-none transition-colors focus-visible:border-primary/60"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Department</span>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              aria-label="Filter by department"
              className={selectClass}
            >
              <option value="">All Departments</option>
              {(filters.data?.departments ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Document Type</span>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              aria-label="Filter by document type"
              className={selectClass}
            >
              <option value="">All Types</option>
              {(filters.data?.documentTypes ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Access Scope</span>
            <select
              value={accessScope}
              onChange={(event) => setAccessScope(event.target.value)}
              aria-label="Filter by access scope"
              className={selectClass}
            >
              <option value="">All Scopes</option>
              {(filters.data?.accessScopes ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminDocumentStatus | "")}
              aria-label="Filter by status"
              className={selectClass}
            >
              <option value="">All Statuses</option>
              {(filters.data?.statuses ?? []).map((value) => (
                <option key={value} value={value}>
                  {documentStatusLabel[value]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-secondary/35 px-3 text-[12px] text-foreground/85 transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      {documents.isLoading ? (
        <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-14 text-center text-[12.5px] text-muted-foreground backdrop-blur-xl">
          Loading document repository…
        </div>
      ) : documents.isError ? (
        <div className="grid place-items-center rounded-2xl border border-hairline bg-card/60 px-6 py-14 text-center backdrop-blur-xl">
          <FolderOpen className="size-5 text-muted-foreground" />
          <p className="mt-2.5 text-[13px] text-foreground/85">Document service not connected</p>
          <p className="mt-1 max-w-[420px] text-[11.5px] text-muted-foreground">
            The repository did not respond, so no documents could be listed.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-hairline bg-card/60 px-6 py-14 text-center backdrop-blur-xl">
          <FolderOpen className="size-6 text-primary/80" />
          <p className="mt-2.5 text-[14px] text-foreground">
            {hasFilters ? "No documents match these filters" : "No documents available"}
          </p>
          <p className="mt-1 max-w-[440px] text-[11.5px] leading-relaxed text-muted-foreground">
            {hasFilters
              ? "Adjust the search or filters to see more of the repository."
              : "The document service returned no records for this organization."}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 h-9 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
            >
              Reset filters
            </button>
          ) : (
            <Link
              to="/upload"
              className="mt-3 flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <UploadCloud className="size-4" />
              Upload Document
            </Link>
          )}
        </div>
      ) : (
        <>
          <AdminDocumentsTable
            documents={rows}
            onView={(doc) => setDialog({ kind: "view", doc })}
            onDetails={(doc) => setDialog({ kind: "view", doc })}
            onEditMetadata={(doc) => setDialog({ kind: "metadata", doc })}
            onChangeScope={(doc) => setDialog({ kind: "scope", doc })}
            onToggleArchive={(doc) => setDialog({ kind: "archive", doc })}
            onDelete={(doc) => setDialog({ kind: "delete", doc })}
            onAudit={() => navigate({ to: "/audit" })}
          />

          <p className="text-[11.5px] text-muted-foreground">
            Showing {rows.length} record{rows.length === 1 ? "" : "s"} from the document service
          </p>
        </>
      )}

      {notice ? (
        <p className="rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] text-muted-foreground">
          {notice}
        </p>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground/80">
        Controlled prototype fixtures served through the document service boundary. No storage
        provider, metadata database, processing pipeline, or vector index is connected, so no
        document has been parsed, embedded, or indexed, and access scope is configuration only —
        retrieval permissions are not enforced yet.
      </p>

      <AdminDocumentViewerDialog
        document={dialog.kind === "view" ? dialog.doc : null}
        onClose={() => setDialog({ kind: "none" })}
      />

      <DocumentMetadataDialog
        document={dialog.kind === "metadata" ? dialog.doc : null}
        departments={filters.data?.departments ?? []}
        documentTypes={filters.data?.documentTypes ?? []}
        submitting={editMetadata.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onSubmit={(patch) => {
          if (dialog.kind !== "metadata") return;
          editMetadata.mutate({ id: dialog.doc.id, patch });
        }}
      />

      <DocumentScopeDialog
        document={dialog.kind === "scope" ? dialog.doc : null}
        options={getAdminDocumentScopeOptions()}
        submitting={changeScope.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onSubmit={(scope) => {
          if (dialog.kind !== "scope") return;
          changeScope.mutate({ id: dialog.doc.id, scope });
        }}
      />

      <ConfirmActionDialog
        open={dialog.kind === "archive"}
        title={
          dialog.kind === "archive" && dialog.doc.status === "archived"
            ? "Restore document"
            : "Archive document"
        }
        description={
          dialog.kind === "archive"
            ? dialog.doc.status === "archived"
              ? `Return ${dialog.doc.name} to the active repository listing?`
              : `Archive ${dialog.doc.name}? It stays in the repository but is marked archived.`
            : ""
        }
        confirmLabel={
          dialog.kind === "archive" && dialog.doc.status === "archived" ? "Restore" : "Archive"
        }
        note="No document backend is connected, so this repository change applies to the current browser session only. Nothing is written to storage, and no index is updated."
        pending={changeStatus.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onConfirm={() => {
          if (dialog.kind !== "archive") return;
          changeStatus.mutate({
            id: dialog.doc.id,
            status: dialog.doc.status === "archived" ? "available" : "archived",
          });
        }}
      />

      <ConfirmActionDialog
        open={dialog.kind === "delete"}
        title="Delete document"
        description={
          dialog.kind === "delete"
            ? `Permanently delete "${dialog.doc.name}" from the database and vector index? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete document"
        destructive
        note="This will permanently delete the document record from PostgreSQL and purge all associated vector embeddings from Qdrant."
        pending={removeDocument.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onConfirm={() => {
          if (dialog.kind !== "delete") return;
          removeDocument.mutate(dialog.doc.id);
        }}
      />
    </section>
  );
}

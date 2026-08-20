import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Filter, RotateCcw, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { DocumentsTable } from "@/documents/components/DocumentsTable";
import { useUserProfile } from "@/auth/use-user-profile";
import { getDocumentFilterOptions, isDocumentInUserScope, listDocuments, reindexDocument } from "@/api/workspace-service";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusPill } from "@/shared/components/ui/status-pill";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Button } from "@/shared/components/ui/button";

import { RoleGuard } from "@/roles/components/RoleGuard";

export const Route = createFileRoute("/_workspace/documents/")({
  head: () => ({ meta: [{ title: "Documents — NeroxaAI Knowledge Library" }, { name: "description", content: "Browse authorized enterprise knowledge." }] }),
  component: DocumentsRoute,
});

function DocumentsRoute() {
  return (
    <RoleGuard permission="documents:read">
      <DocumentsPage />
    </RoleGuard>
  );
}

function DocumentsPage() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [accessScope, setAccessScope] = useState("");
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  const filters = useQuery({ queryKey: ["document-filter-options"], queryFn: getDocumentFilterOptions });
  const documents = useQuery({
    queryKey: ["documents", search, department, documentType, accessScope],
    queryFn: () => listDocuments({ search, department, documentType, accessScope }),
  });

  const reindexMutation = useMutation({
    mutationFn: (docId: string) => reindexDocument(docId),
    onSuccess: (result) => {
      setReindexingId(null);
      if (result.success) {
        setNotice({ message: result.message });
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      } else {
        setNotice({ message: result.message, isError: true });
      }
    },
    onError: (err: any) => {
      setReindexingId(null);
      setNotice({ message: err?.message || "Failed to re-index document", isError: true });
    },
  });

  const handleReindex = (doc: any) => {
    setReindexingId(doc.id);
    setNotice(null);
    reindexMutation.mutate(doc.id);
  };

  const rows = documents.data ?? [];
  const hasFilters = !!(search || department || documentType || accessScope);
  const restrictedIds = useMemo(() => {
    const identity = profile ? { role: profile.role, accessScope: profile.accessScope } : null;
    return new Set(rows.filter((doc) => !isDocumentInUserScope(doc, identity)).map((doc) => doc.id));
  }, [rows, profile]);

  const reset = () => {
    setSearch("");
    setDepartment("");
    setDocumentType("");
    setAccessScope("");
  };

  const selectClass =
    "h-10 rounded-2xl border border-hairline bg-secondary/35 px-3 text-[12px] font-medium text-foreground outline-none transition-all hover:bg-secondary/60 hover:border-primary/40 focus-visible:border-primary/60 shadow-xs";

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        eyebrow="Knowledge library"
        title="Documents"
        description="Discover and open the knowledge available to your workspace, with access scope kept visible throughout the experience."
        actions={
          <StatusPill tone="accent" icon={<ShieldCheck className="size-3" />}>
            Access scoped
          </StatusPill>
        }
      />

      {notice ? (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-[12.5px] shadow-sm backdrop-blur-md transition-all ${
            notice.isError
              ? "border-destructive/35 bg-destructive/10 text-destructive"
              : "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 hover:bg-foreground/10"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <section className="rounded-3xl border border-hairline bg-gradient-to-br from-card/85 via-card/55 to-primary/[0.04] p-4 shadow-lg backdrop-blur-2xl transition-all">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by document name or content..."
              aria-label="Search documents"
              className="h-10 w-full rounded-2xl border border-hairline bg-background/40 pl-10 pr-3.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              aria-label="Filter by department"
              className={selectClass}
            >
              <option value="">All departments</option>
              {(filters.data?.departments ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              aria-label="Filter by document type"
              className={selectClass}
            >
              <option value="">All types</option>
              {(filters.data?.documentTypes ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={accessScope}
              onChange={(event) => setAccessScope(event.target.value)}
              aria-label="Filter by access scope"
              className={selectClass}
            >
              <option value="">All access scopes</option>
              {(filters.data?.accessScopes ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={!hasFilters}
              className="h-10 rounded-2xl border-hairline px-3.5 text-[12px] font-medium"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground border-t border-hairline/50 pt-2">
          <SlidersHorizontal className="size-3.5 text-primary" />
          <span>
            {rows.length} visible record{rows.length === 1 ? "" : "s"} · Filtered to your workspace scope
          </span>
        </div>
      </section>

      {documents.isLoading ? (
        <div className="rounded-3xl border border-hairline bg-card/40 px-6 py-16 text-center text-[12.5px] text-muted-foreground backdrop-blur-xl">
          Loading authorized documents…
        </div>
      ) : documents.isError ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="Document service unavailable"
          description="The document service did not respond. Try again or contact your workspace administrator."
          action={
            <Button variant="outline" size="sm" onClick={() => documents.refetch()}>
              Try again
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Filter className="size-5" />}
          title={hasFilters ? "No matching documents" : "No documents available"}
          description={
            hasFilters
              ? "Try adjusting the filters or clear the current search."
              : "No authorized document repository content is available in this workspace yet."
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DocumentsTable
          documents={rows}
          restrictedIds={restrictedIds}
          onReindex={handleReindex}
          reindexingId={reindexingId}
        />
      )}
    </div>
  );
}

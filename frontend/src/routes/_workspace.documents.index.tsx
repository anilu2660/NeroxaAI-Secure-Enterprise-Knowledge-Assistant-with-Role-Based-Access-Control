import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { DocumentsTable } from "@/documents/components/DocumentsTable";
import { useUserProfile } from "@/auth/use-user-profile";
import {
  getDocumentFilterOptions,
  isDocumentInUserScope,
  listDocuments,
} from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/documents/")({
  head: () => ({
    meta: [
      { title: "Documents — NeroxaAI Knowledge Library" },
      {
        name: "description",
        content:
          "Browse the organizational knowledge available to your NeroxaAI workspace, filtered by department, document type, and access scope.",
      },
      { property: "og:title", content: "Documents — NeroxaAI Knowledge Library" },
      {
        property: "og:description",
        content: "Search and open the documents available to your workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

const selectClass =
  "h-10 min-w-[132px] rounded-xl border border-hairline bg-card/70 px-3 text-[12.5px] text-foreground/90 outline-none transition-colors hover:bg-accent/50 focus-visible:border-primary/60";

function DocumentsPage() {
  const { profile } = useUserProfile();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [accessScope, setAccessScope] = useState("");

  const filters = useQuery({
    queryKey: ["document-filter-options"],
    queryFn: getDocumentFilterOptions,
  });

  const documents = useQuery({
    queryKey: ["documents", search, department, documentType, accessScope],
    queryFn: () => listDocuments({ search, department, documentType, accessScope }),
  });

  const hasFilters = !!(search || department || documentType || accessScope);
  const rows = documents.data ?? [];

  // Access Scope comes from the administered user record — the same source the
  // Account page and Your Access panel use.
  const restrictedIds = useMemo(() => {
    const identity = profile ? { role: profile.role, accessScope: profile.accessScope } : null;
    return new Set(
      rows.filter((doc) => !isDocumentInUserScope(doc, identity)).map((doc) => doc.id),
    );
  }, [rows, profile]);

  const reset = () => {
    setSearch("");
    setDepartment("");
    setDocumentType("");
    setAccessScope("");
  };

  return (
    <section className="space-y-4 pt-1">
      <header>
        <h1 className="font-display text-[27px] font-medium tracking-tight text-foreground">
          Documents
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Browse and access the knowledge available to your workspace
          {profile
            ? ` · ${profile.department} · ${profile.roleLabel.split("·").pop()?.trim()}`
            : ""}
          .
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="relative flex min-w-[260px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents by name or content..."
            aria-label="Search documents"
            className="h-11 w-full rounded-xl border border-hairline bg-card/60 pl-10 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/80 outline-none backdrop-blur-xl transition-colors focus-visible:border-primary/60"
          />
        </label>

        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Filter by department"
          className={selectClass}
        >
          <option value="">Department</option>
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
          <option value="">Document Type</option>
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
          <option value="">Access Scope</option>
          {(filters.data?.accessScopes ?? []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={reset}
          disabled={!hasFilters}
          className="flex h-10 items-center gap-2 rounded-xl border border-hairline bg-card/70 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {documents.isLoading ? (
        <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-12 text-center text-[12.5px] text-muted-foreground backdrop-blur-xl">
          Loading documents…
        </div>
      ) : documents.isError ? (
        <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-12 text-center backdrop-blur-xl">
          <p className="text-[13px] text-foreground/85">Document service unavailable</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            The document service did not respond, so nothing was loaded.
          </p>
        </div>
      ) : rows.length === 0 && !hasFilters ? (
        <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-12 text-center backdrop-blur-xl">
          <p className="text-[13px] text-foreground/85">No documents available</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            No document repository is connected to this workspace yet.
          </p>
        </div>
      ) : (
        <>
          <DocumentsTable documents={rows} restrictedIds={restrictedIds} />
          {rows.length === 0 && hasFilters ? (
            <button
              type="button"
              onClick={reset}
              className="mx-auto flex items-center gap-2 rounded-xl border border-hairline bg-card/70 px-3.5 py-2 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
            >
              <RotateCcw className="size-3.5" />
              Reset filters
            </button>
          ) : null}
        </>
      )}

      <p className="text-[11px] text-muted-foreground/80">
        Prototype catalog — no document repository, storage, or backend RBAC enforcement is
        connected. Access scope is compared in the frontend only, against the scope an administrator
        assigned to your account.
      </p>
    </section>
  );
}

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, FileText, Lock } from "lucide-react";
import { useUserProfile } from "@/auth/use-user-profile";
import { DocumentInfoPanel } from "@/documents/components/DocumentInfoPanel";
import { DocumentViewer } from "@/documents/components/DocumentViewer";
import {
  getDocument,
  getDocumentCitation,
  getCitationServiceStatus,
  getDocumentPreviewPage,
  isDocumentInUserScope,
} from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/documents/$documentId")({
  validateSearch: z.object({
    page: z.coerce.number().optional(),
    /** "assistant" when the page was opened from an AI citation. */
    from: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Document Details — NeroxaAI" },
      {
        name: "description",
        content: "Document metadata, page preview, and the citation locations used in AI answers.",
      },
      { property: "og:title", content: "Document Details — NeroxaAI" },
      { property: "og:description", content: "Document metadata and citation locations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentDetailsPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-12 text-center backdrop-blur-xl">
      {children}
    </div>
  );
}

function DocumentDetailsPage() {
  const { documentId } = Route.useParams();
  const { page: pageParam, from } = Route.useSearch();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const document = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId),
  });

  const doc = document.data ?? null;
  const total = doc?.pageCount ?? 1;
  const requestedPage = pageParam ?? 1;
  const page = Math.max(1, Math.min(total, requestedPage));
  const pageOutOfRange = requestedPage !== page;
  const fromAssistant = from === "assistant";

  const preview = useQuery({
    queryKey: ["document-preview", documentId, page],
    queryFn: () => getDocumentPreviewPage(documentId, page),
    enabled: !!doc,
  });

  const citation = useQuery({
    queryKey: ["document-citation", documentId, pageParam ?? null],
    queryFn: () => getDocumentCitation(documentId, pageParam ?? null),
    enabled: !!doc && fromAssistant,
  });

  const citationStatus = getCitationServiceStatus();

  const inScope = doc
    ? isDocumentInUserScope(
        doc,
        profile ? { role: profile.role, accessScope: profile.accessScope } : null,
      )
    : false;

  const goToPage = (next: number) =>
    navigate({
      to: "/documents/$documentId",
      params: { documentId },
      search: { page: next, ...(fromAssistant ? { from: "assistant" } : {}) },
      replace: true,
    });

  return (
    <section className="space-y-3 pt-1">
      <nav className="flex flex-wrap items-center gap-3 text-[12.5px]">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Documents
        </Link>
        {fromAssistant ? (
          <>
            <span aria-hidden className="h-3.5 w-px bg-hairline" />
            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
              Back to Assistant
            </Link>
          </>
        ) : null}
        {doc ? (
          <>
            <span aria-hidden className="h-3.5 w-px bg-hairline" />
            <span className="inline-flex items-center gap-1.5 text-foreground/85">
              <FileText className="size-3.5 text-muted-foreground" />
              {doc.title}
            </span>
          </>
        ) : null}
      </nav>

      {document.isLoading ? (
        <Shell>
          <p className="text-[12.5px] text-muted-foreground">Loading document…</p>
        </Shell>
      ) : !doc ? (
        <Shell>
          <p className="text-[13px] text-foreground/85">Document not found</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[11.5px] leading-relaxed text-muted-foreground">
            No document with the id “{documentId}” is available to this workspace. It may have been
            removed from the prototype fixture, or the id is incorrect.
          </p>
        </Shell>
      ) : !inScope ? (
        <Shell>
          <Lock className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-[13px] text-foreground/85">Restricted in this session</p>
          <p className="mx-auto mt-1 max-w-[54ch] text-[11.5px] leading-relaxed text-muted-foreground">
            “{doc.title}” requires the “{doc.accessScope}” access scope, which is not assigned to
            your account in Admin → User Management. No backend permission check was performed —
            this is a frontend scope comparison only.
          </p>
        </Shell>
      ) : (
        <>
          {pageOutOfRange ? (
            <p className="rounded-xl border border-hairline bg-secondary/30 px-3 py-2 text-[11.5px] text-muted-foreground">
              Page {requestedPage} is outside this document’s available range (1–{total}). Showing
              page {page} instead.
            </p>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            <div className="lg:h-[calc(100svh-172px)] lg:overflow-y-auto lg:pr-1">
              <DocumentInfoPanel
                doc={doc}
                citation={citation.data ?? null}
                citationStatus={fromAssistant ? citationStatus : null}
                citedPageAvailable={!!preview.data}
              />
            </div>
            <div className="lg:h-[calc(100svh-172px)]">
              <DocumentViewer
                doc={doc}
                page={page}
                preview={preview.data ?? null}
                loading={preview.isLoading}
                citation={fromAssistant ? (citation.data ?? null) : null}
                onPageChange={goToPage}
              />
            </div>
          </div>

          {doc.prototype ? (
            <p className="text-[11px] text-muted-foreground/80">
              Prototype fixture — this document record and its page preview are UI demonstration
              data. No document storage, PDF service, or retrieval backend is connected.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

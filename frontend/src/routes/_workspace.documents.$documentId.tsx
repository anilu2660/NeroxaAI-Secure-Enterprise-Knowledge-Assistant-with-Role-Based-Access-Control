import type { ReactNode } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, FileText, Lock, ShieldCheck } from "lucide-react";
import { useUserProfile } from "@/auth/use-user-profile";
import { DocumentInfoPanel } from "@/documents/components/DocumentInfoPanel";
import { DocumentViewer } from "@/documents/components/DocumentViewer";
import { getDocument, getDocumentCitation, getCitationServiceStatus, getDocumentPreviewPage, isDocumentInUserScope } from "@/api/workspace-service";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusPill } from "@/shared/components/ui/status-pill";

export const Route = createFileRoute("/_workspace/documents/$documentId")({
  validateSearch: z.object({ page: z.coerce.number().optional(), from: z.string().optional() }),
  head: () => ({ meta: [{ title: "Document Details — NeroxaAI" }, { name: "description", content: "Secure document metadata, preview and citation context." }] }),
  component: DocumentDetailsPage,
});

function Shell({ children }: { children: ReactNode }) { return <div className="rounded-2xl border border-hairline bg-card/55 px-6 py-14 text-center shadow-sm backdrop-blur-xl">{children}</div>; }

function DocumentDetailsPage() {
  const { documentId } = Route.useParams(); const { page: pageParam, from } = Route.useSearch(); const navigate = useNavigate(); const { profile } = useUserProfile();
  const document = useQuery({ queryKey: ["document", documentId], queryFn: () => getDocument(documentId) }); const doc = document.data ?? null; const total = doc?.pageCount ?? 1; const requestedPage = pageParam ?? 1; const page = Math.max(1, Math.min(total, requestedPage)); const fromAssistant = from === "assistant";
  const preview = useQuery({ queryKey: ["document-preview", documentId, page], queryFn: () => getDocumentPreviewPage(documentId, page), enabled: !!doc });
  const citation = useQuery({ queryKey: ["document-citation", documentId, pageParam ?? null], queryFn: () => getDocumentCitation(documentId, pageParam ?? null), enabled: !!doc && fromAssistant });
  const inScope = doc ? isDocumentInUserScope(doc, profile ? { role: profile.role, accessScope: profile.accessScope } : null) : false;
  const goToPage = (next: number) => navigate({ to: "/documents/$documentId", params: { documentId }, search: { page: next, ...(fromAssistant ? { from: "assistant" } : {}) }, replace: true });
  return <div className="space-y-5">
    <nav className="flex flex-wrap items-center gap-2 text-[11px]"><Link to="/documents" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Documents</Link>{fromAssistant ? <><span className="h-3.5 w-px bg-hairline" /><Link to="/assistant" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3.5" />Assistant</Link></> : null}</nav>
    {document.isLoading ? <Shell><p className="text-[12px] text-muted-foreground">Loading secure document…</p></Shell> : !doc ? <Shell><FileText className="mx-auto size-5 text-muted-foreground" /><p className="mt-3 text-[13px] text-foreground">Document not found</p><p className="mt-1 text-[11px] text-muted-foreground">This document is not available in the current workspace.</p></Shell> : !inScope ? <Shell><Lock className="mx-auto size-5 text-muted-foreground" /><p className="mt-3 text-[13px] text-foreground">Restricted in this session</p><p className="mx-auto mt-1 max-w-lg text-[11.5px] leading-relaxed text-muted-foreground">This document requires the “{doc.accessScope}” access scope. The workspace UI has hidden the document content from this session.</p></Shell> : <>
      <PageHeader eyebrow="Knowledge source" title={doc.title} description="Inspect document metadata, page previews, and the citation context used by NeroxaAI." actions={<StatusPill tone="success" icon={<ShieldCheck className="size-3" />}>{fromAssistant ? "Citation context" : "Authorized"}</StatusPill>} />
      {requestedPage !== page ? <p className="rounded-xl border border-hairline bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">Page {requestedPage} is outside the available range (1–{total}); showing page {page}.</p> : null}
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start"><div className="xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100svh-120px)] xl:overflow-y-auto xl:pr-1"><DocumentInfoPanel doc={doc} citation={citation.data ?? null} citationStatus={fromAssistant ? getCitationServiceStatus() : null} citedPageAvailable={!!preview.data} /></div><div className="min-w-0 xl:min-h-[calc(100svh-160px)]"><DocumentViewer doc={doc} page={page} preview={preview.data ?? null} loading={preview.isLoading} citation={fromAssistant ? (citation.data ?? null) : null} onPageChange={goToPage} /></div></div>
      {doc.prototype ? <p className="text-[10.5px] text-muted-foreground/70">Prototype fixture — document preview data is used for the current UI demonstration.</p> : null}
    </>}
  </div>;
}

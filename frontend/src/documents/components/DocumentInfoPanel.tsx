import { FileText, Quote, SquareArrowOutUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Citation, CitationServiceStatus, DocumentRecord } from "@/api/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[7px]">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="truncate text-[12px] font-medium text-foreground/90">{value}</span>
    </div>
  );
}

/**
 * Left information panel: document identity, metadata, about, and — only when
 * the user arrived from an assistant citation — the citation context. Citation
 * content is never authored here: it comes from the retrieval service, so while
 * that service is absent the section states plainly that nothing can be shown.
 */
export function DocumentInfoPanel({
  doc,
  citation,
  citationStatus,
  citedPageAvailable,
}: {
  doc: DocumentRecord;
  /** Real retrieval citation, or null when none exists. */
  citation: Citation | null;
  /** Retrieval/citation service state, set only when opened from the assistant. */
  citationStatus: CitationServiceStatus | null;
  citedPageAvailable: boolean;
}) {
  return (
    <aside className="space-y-3">
      <div className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-hairline bg-secondary/60">
            <FileText className="size-4 text-foreground/75" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-[16px] font-medium tracking-tight text-foreground">
                {doc.title}
              </h1>
              <span className="shrink-0 rounded-full border border-allowed/30 bg-allowed/10 px-2 py-[1px] text-[10.5px] text-allowed">
                {doc.documentType}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              {doc.version ? `Version ${doc.version} · ` : ""}
              {doc.kind} Document
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground/85">
              Access via NeroxaAI · Controlled Document
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-hairline bg-card/60 px-4 py-3 backdrop-blur-xl">
        <h2 className="text-[12.5px] font-medium text-foreground">Document Information</h2>
        <div className="mt-1.5 divide-y divide-hairline">
          <Row label="Department" value={doc.department} />
          <Row label="Access Scope" value={doc.accessScope} />
          <Row label="Document Type" value={doc.documentType} />
          <Row label="Last Updated" value={doc.updatedLabel} />
          <Row label="Updated By" value={doc.updatedBy} />
          {doc.version ? <Row label="Version" value={doc.version} /> : null}
        </div>
      </section>

      {doc.about ? (
        <section className="rounded-2xl border border-hairline bg-card/60 px-4 py-3 backdrop-blur-xl">
          <h2 className="text-[12.5px] font-medium text-foreground">About this Document</h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{doc.about}</p>
        </section>
      ) : null}

      {citation ? (
        <section className="rounded-2xl border border-hairline bg-card/60 px-4 py-3 backdrop-blur-xl">
          <h2 className="text-[12.5px] font-medium text-foreground">AI Citation Context</h2>
          <div className="mt-2 rounded-xl border border-hairline bg-secondary/30 px-3 py-2.5">
            <div className="flex gap-2">
              <Quote className="mt-[3px] size-3 shrink-0 text-allowed" />
              <p className="text-[11.5px] leading-relaxed text-foreground/85">
                As stated in{" "}
                <span className="font-medium text-foreground">{citation.documentTitle}</span>
                {citation.page ? `, Page ${citation.page}` : ""}
                {citation.snippet ? `, ${citation.snippet}` : "."}
              </p>
            </div>
          </div>

          {citation.page ? (
            <Link
              to="/documents/$documentId"
              params={{ documentId: doc.id }}
              search={{ page: citation.page, from: "assistant" as const }}
              aria-disabled={!citedPageAvailable}
              className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-secondary/40 px-3 py-2.5 text-[12.5px] text-foreground/90 transition-colors hover:bg-accent/60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
            >
              Open Cited Page {citation.page}
              <SquareArrowOutUpRight className="size-3.5" />
            </Link>
          ) : null}
        </section>
      ) : citationStatus ? (
        <section className="rounded-2xl border border-hairline bg-card/60 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[12.5px] font-medium text-foreground">AI Citation Context</h2>
            <span className="shrink-0 rounded-md border border-hairline px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
              {citationStatus.label}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {citationStatus.detail}
          </p>
        </section>
      ) : null}
    </aside>
  );
}

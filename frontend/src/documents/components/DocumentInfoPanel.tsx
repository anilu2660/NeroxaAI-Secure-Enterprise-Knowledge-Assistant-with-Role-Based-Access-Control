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
  citation: Citation | null;
  citationStatus: CitationServiceStatus | null;
  citedPageAvailable: boolean;
}) {
  return (
    <aside className="space-y-4">
      {/* Hero Header Card */}
      <div className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 text-primary-foreground shadow-md shadow-primary/25">
            <FileText className="size-5.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-[16.5px] font-bold tracking-tight text-foreground">
                {doc.title}
              </h1>
              <span className="shrink-0 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-400 shadow-xs">
                {doc.documentType}
              </span>
            </div>
            <p className="mt-1 text-[12px] font-medium text-muted-foreground">
              {doc.version ? `Version ${doc.version} · ` : ""}
              {doc.kind} Document
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              Access via NeroxaAI · Controlled Document
            </p>
          </div>
        </div>
      </div>

      {/* Metadata Table Card */}
      <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
        <h2 className="font-display text-sm font-semibold text-foreground pb-2.5 border-b border-hairline">
          Document Information
        </h2>
        <div className="mt-3 space-y-2">
          <Row label="Department" value={doc.department} />
          <Row label="Access Scope" value={doc.accessScope} />
          <Row label="Document Type" value={doc.documentType} />
          <Row label="Last Updated" value={doc.updatedLabel} />
          <Row label="Updated By" value={doc.updatedBy} />
          {doc.version ? <Row label="Version" value={doc.version} /> : null}
        </div>
      </section>

      {/* About Section Card */}
      {doc.about ? (
        <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
          <h2 className="font-display text-sm font-semibold text-foreground pb-2.5 border-b border-hairline">
            About this Document
          </h2>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{doc.about}</p>
        </section>
      ) : null}

      {/* AI Citation Context Card */}
      {citation ? (
        <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
          <h2 className="font-display text-sm font-semibold text-foreground pb-2.5 border-b border-hairline">
            AI Citation Context
          </h2>
          <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <div className="flex gap-2.5">
              <Quote className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <p className="text-[12px] leading-relaxed text-foreground/90">
                As stated in{" "}
                <span className="font-semibold text-foreground">{citation.documentTitle}</span>
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
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-secondary/35 px-4 py-2.5 text-[12.5px] font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary/60"
            >
              Open Cited Page {citation.page}
              <SquareArrowOutUpRight className="size-4 text-primary" />
            </Link>
          ) : null}
        </section>
      ) : citationStatus ? (
        <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-hairline">
            <h2 className="font-display text-sm font-semibold text-foreground">AI Citation Context</h2>
            <span className="shrink-0 rounded-full border border-hairline bg-secondary/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {citationStatus.label}
            </span>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            {citationStatus.detail}
          </p>
        </section>
      ) : null}
    </aside>
  );
}

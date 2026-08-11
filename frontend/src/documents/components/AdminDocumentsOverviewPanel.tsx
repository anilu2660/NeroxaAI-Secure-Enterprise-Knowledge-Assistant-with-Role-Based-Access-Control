import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderOpen, Upload } from "lucide-react";
import type { AdminDocumentOverview } from "@/api/types";

/**
 * Document Management Overview. Counts are null while no document service is
 * connected, so the card shows an honest empty state instead of totals.
 */
export function AdminDocumentsOverviewPanel({
  overview,
}: {
  overview: AdminDocumentOverview | null;
}) {
  const hasData =
    !!overview &&
    (overview.totalDocuments !== null ||
      overview.indexedDocuments !== null ||
      overview.pendingReview !== null);

  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
      <h2 className="font-display text-[15px] font-medium tracking-tight text-foreground">
        Document Management Overview
      </h2>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
        Quick overview of your knowledge repository
      </p>

      <div className="mt-3 flex flex-1 flex-col">
        {hasData ? (
          <dl className="flex-1 space-y-2">
            {[
              { label: "Total documents", value: overview?.totalDocuments },
              { label: "Indexed documents", value: overview?.indexedDocuments },
              { label: "Pending review", value: overview?.pendingReview },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-hairline bg-secondary/25 px-3 py-2"
              >
                <dt className="text-[12px] text-muted-foreground">{row.label}</dt>
                <dd className="text-[12.5px] text-foreground">{row.value ?? "Unavailable"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-hairline bg-secondary/20 px-4 py-7 text-center">
            <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-card/60 text-muted-foreground">
              <FolderOpen className="size-5" />
            </span>
            <p className="mt-2.5 text-[13px] text-foreground">No documents available</p>
            <p className="mt-1 max-w-[34ch] text-[11px] leading-relaxed text-muted-foreground">
              {overview?.status ?? "Document service not connected"} — repository totals will appear
              here once it is.
            </p>
          </div>
        )}

        <Link
          to="/upload"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-secondary/30 px-3 py-2 text-[12.5px] text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Upload className="size-3.5" />
          Upload Your First Document
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

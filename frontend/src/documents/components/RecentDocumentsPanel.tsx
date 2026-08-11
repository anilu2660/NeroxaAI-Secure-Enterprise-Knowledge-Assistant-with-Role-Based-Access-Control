import { Link } from "@tanstack/react-router";
import { FileText, ShieldCheck } from "lucide-react";
import type { DocumentSummary } from "@/api/types";

export function RecentDocumentsPanel({ documents }: { documents: DocumentSummary[] }) {
  return (
    <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
      <h2 className="font-display text-[13.5px] font-medium text-foreground">Recent Documents</h2>
      {documents.length ? (
        <div className="mt-3 space-y-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to="/documents/$documentId"
              params={{ documentId: doc.id }}
              className="flex items-center gap-2.5 rounded-xl border border-hairline bg-secondary/35 px-3 py-2 transition-colors hover:bg-accent/60"
            >
              <FileText className="size-3.5 shrink-0 text-foreground/70" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] leading-snug text-foreground">
                  {doc.title}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                  {doc.department} · {doc.updatedLabel}
                </span>
              </span>
              {doc.rbacProtected ? (
                <span
                  title="Restricted access scope — configured in Document Management, not enforced by any backend yet"
                  className="flex shrink-0 items-center gap-1 rounded-md border border-hairline bg-card/70 px-1.5 py-0.5 text-[9.5px] text-muted-foreground"
                >
                  <ShieldCheck className="size-2.5" />
                  Restricted
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-hairline bg-secondary/20 px-3 py-4">
          <FileText className="size-4 text-muted-foreground" />
          <p className="mt-2 text-[12.5px] text-foreground/85">No documents available yet</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Documents inside your assigned access scope will be listed here.
          </p>
        </div>
      )}
    </section>
  );
}

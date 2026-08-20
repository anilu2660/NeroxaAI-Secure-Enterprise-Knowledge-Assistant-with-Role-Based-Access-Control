import { Link } from "@tanstack/react-router";
import { FolderOpen, FileText, Lock, ShieldCheck } from "lucide-react";
import type { DocumentSummary } from "@/api/types";

export function RecentDocumentsPanel({ documents }: { documents: DocumentSummary[] }) {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
      <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <FolderOpen className="size-4.5" />
        </span>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Recent Documents</h2>
          <p className="text-[11px] text-muted-foreground">Authorized knowledge base files</p>
        </div>
      </div>

      {documents.length ? (
        <div className="mt-4 space-y-2.5">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to="/documents/$documentId"
              params={{ documentId: doc.id }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-secondary/25 p-3.5 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/30 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid size-9 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {doc.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {doc.department} · {doc.updatedLabel}
                  </p>
                </div>
              </div>

              {doc.rbacProtected ? (
                <span
                  title="Restricted access scope — assigned in Document Management"
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-medium text-amber-400 shadow-xs"
                >
                  <ShieldCheck className="size-3" />
                  Restricted
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-hairline/80 bg-secondary/20 p-6 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-2xl border border-hairline bg-secondary/40 text-muted-foreground shadow-xs">
            <FolderOpen className="size-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-foreground">No documents available yet</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Documents inside your assigned access scope will be listed here.
          </p>
        </div>
      )}
    </section>
  );
}

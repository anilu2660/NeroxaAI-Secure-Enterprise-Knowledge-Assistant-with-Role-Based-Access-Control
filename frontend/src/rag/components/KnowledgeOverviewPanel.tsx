import { BarChart3, Database } from "lucide-react";
import type { KnowledgeOverview } from "@/api/types";

export function KnowledgeOverviewPanel({ overview }: { overview: KnowledgeOverview }) {
  const rows = [
    { label: "Accessible Documents", value: overview.accessibleDocuments },
    { label: "Recent Queries (24h)", value: overview.recentQueries24h },
    { label: "Active Departments", value: overview.activeDepartments },
    { label: "Indexed Knowledge", value: overview.indexedKnowledge },
  ];

  const hasData = rows.some((row) => row.value !== null && row.value !== undefined);

  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
      <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <BarChart3 className="size-4.5" />
        </span>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Knowledge Overview</h2>
          <p className="text-[11px] text-muted-foreground">RAG indexing &amp; query metrics</p>
        </div>
      </div>

      {hasData ? (
        <dl className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-secondary/25 p-3.5 transition-all hover:bg-secondary/45 shadow-xs"
            >
              <dt className="text-[12px] font-medium text-muted-foreground">{row.label}</dt>
              <dd className="font-display text-base font-bold tracking-tight text-foreground">
                {row.value === null || row.value === undefined ? "—" : String(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-hairline/80 bg-secondary/20 p-6 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-2xl border border-hairline bg-secondary/40 text-muted-foreground shadow-xs">
            <Database className="size-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-foreground">No knowledge metrics yet</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Coverage, query volume and index size appear once the knowledge base is connected.
          </p>
        </div>
      )}
    </section>
  );
}

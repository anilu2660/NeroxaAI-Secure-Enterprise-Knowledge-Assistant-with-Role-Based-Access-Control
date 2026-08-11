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
    <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
      <h2 className="font-display text-[13.5px] font-medium text-foreground">Knowledge Overview</h2>
      {hasData ? (
        <dl className="mt-1.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="border-t border-hairline py-2 first:border-t-0 first:pt-1.5"
            >
              <dt className="text-[11px] text-muted-foreground">{row.label}</dt>
              <dd className="mt-0.5 font-display text-[17px] font-medium leading-tight text-foreground">
                {row.value === null || row.value === undefined ? "—" : String(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-2.5 rounded-xl border border-dashed border-hairline bg-secondary/20 px-3 py-4">
          <p className="text-[12.5px] text-foreground/85">No knowledge metrics yet</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Coverage, query volume and index size appear once the knowledge base is connected.
          </p>
        </div>
      )}
    </section>
  );
}

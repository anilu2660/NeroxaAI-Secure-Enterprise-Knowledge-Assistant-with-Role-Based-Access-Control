import { ClipboardList, ExternalLink, ShieldAlert } from "lucide-react";
import type { AuditEvent, AuditEventPage } from "@/api/types";

const columns = [
  "Timestamp",
  "Actor",
  "Action / Event",
  "Resource",
  "Category",
  "Result / Status",
  "Severity",
  "Details",
];

const severityClass: Record<AuditEvent["severity"], string> = {
  info: "border-primary/30 bg-primary/10 text-primary font-bold shadow-xs",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-400 font-semibold shadow-xs",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold shadow-xs",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold shadow-xs",
  critical: "border-rose-500/35 bg-rose-500/12 text-rose-400 font-bold shadow-xs",
};

const resultClass: Record<AuditEvent["result"], string> = {
  success: "border-emerald-500/35 bg-emerald-500/12 text-emerald-400 font-medium",
  failure: "border-rose-500/35 bg-rose-500/12 text-rose-400 font-medium",
  denied: "border-amber-500/35 bg-amber-500/12 text-amber-400 font-medium",
  pending: "border-hairline bg-secondary/40 text-muted-foreground font-medium",
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface Props {
  page: AuditEventPage;
  loading: boolean;
  onInspect: (event: AuditEvent) => void;
}

/**
 * Renders audit records with a smooth sliding viewport and sticky header.
 */
export function AuditEventsTable({ page, loading, onInspect }: Props) {
  const events = page.events;

  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-card/60 shadow-xl backdrop-blur-2xl transition-all">
      <div className="max-h-[520px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-secondary/20">
        <table className="w-full min-w-[1020px] border-collapse text-left">
          <thead className="sticky top-0 z-20 border-b border-hairline/80 bg-card/95 backdrop-blur-2xl">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/60">
            {events.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <EmptyOrUnavailable page={page} loading={loading} />
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="text-[12.5px] transition-all duration-200 hover:bg-primary/[0.03]"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11.5px] text-muted-foreground">
                    {formatTimestamp(event.timestampIso)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block truncate font-display font-semibold text-foreground">
                      {event.actorName}
                    </span>
                    <span className="inline-block rounded-full bg-secondary/60 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground border border-hairline/60 mt-0.5">
                      {event.actorRole}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground/90 max-w-[280px]">
                    <span className="line-clamp-2">{event.actionLabel}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block truncate font-semibold text-foreground/90">
                      {event.resourceLabel}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {event.resourceType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-md bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80 border border-hairline/60">
                      {event.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${resultClass[event.result]}`}
                    >
                      {event.result === "success" ? (
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ) : null}
                      <span className="capitalize">{event.result}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider uppercase ${severityClass[event.severity]}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onInspect(event)}
                      className="rounded-xl border border-hairline bg-secondary/35 px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-all hover:bg-card hover:border-primary/40 hover:text-primary shadow-xs active:scale-95"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyOrUnavailable({ page, loading }: { page: AuditEventPage; loading: boolean }) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="font-display text-sm font-semibold text-foreground">Querying audit service…</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">Fetching verified audit logs from PostgreSQL.</p>
      </div>
    );
  }

  const unavailable = !page.available;

  return (
    <div className="mx-auto max-w-[440px] text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-3xl border border-primary/30 bg-primary/15 text-primary shadow-md shadow-primary/20">
        {unavailable ? (
          <ShieldAlert className="size-7" />
        ) : (
          <ClipboardList className="size-7" />
        )}
      </span>
      <h2 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">
        No audit events available
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {unavailable
          ? "Audit events will appear here once administrative or system activity is recorded in the PostgreSQL database."
          : "The audit service returned no events matching the current search filters."}
      </p>
    </div>
  );
}

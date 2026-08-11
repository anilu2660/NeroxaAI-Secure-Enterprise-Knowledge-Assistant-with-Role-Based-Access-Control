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
  info: "border-hairline bg-secondary/45 text-muted-foreground",
  low: "border-sky-400/25 bg-sky-400/10 text-sky-300/90",
  medium: "border-amber-400/25 bg-amber-400/10 text-amber-300/90",
  high: "border-orange-400/25 bg-orange-400/10 text-orange-300/90",
  critical: "border-destructive/35 bg-destructive/12 text-destructive",
};

const resultClass: Record<AuditEvent["result"], string> = {
  success: "text-emerald-300/90",
  failure: "text-destructive",
  denied: "text-amber-300/90",
  pending: "text-muted-foreground",
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
 * Renders whatever the audit service returned. With no connected service the
 * unavailable/empty state is the correct and only state — rows are never
 * fabricated to make the table look populated.
 */
export function AuditEventsTable({ page, loading, onInspect }: Props) {
  const events = page.events;

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card/60 backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-secondary/25">
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <EmptyOrUnavailable page={page} loading={loading} />
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-hairline/70 text-[12.5px] transition-colors last:border-0 hover:bg-accent/25"
                >
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-muted-foreground">
                    {formatTimestamp(event.timestampIso)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="block truncate text-foreground">{event.actorName}</span>
                    <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                      {event.actorRole}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-foreground/90">{event.actionLabel}</td>
                  <td className="px-3.5 py-2.5 text-muted-foreground">
                    <span className="block truncate text-foreground/85">{event.resourceLabel}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {event.resourceType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-muted-foreground">
                    {event.category}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3.5 py-2.5 capitalize ${resultClass[event.result]}`}
                  >
                    {event.result}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] uppercase tracking-wide ${severityClass[event.severity]}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => onInspect(event)}
                      className="rounded-lg border border-hairline bg-secondary/40 px-2.5 py-1 text-[11.5px] text-foreground/85 transition-colors hover:bg-accent/60"
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
      <p className="text-center text-[12.5px] text-muted-foreground">Querying audit service…</p>
    );
  }

  const unavailable = !page.available;

  return (
    <div className="mx-auto max-w-[420px] text-center">
      <span className="mx-auto grid size-[86px] place-items-center rounded-full border border-primary/25 bg-primary/[0.07]">
        {unavailable ? (
          <ShieldAlert className="size-9 text-primary/80" />
        ) : (
          <ClipboardList className="size-9 text-primary/80" />
        )}
      </span>
      <h2 className="mt-3.5 font-display text-[20px] font-medium tracking-tight text-foreground">
        No audit events available
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {unavailable
          ? "Audit events will appear here once the audit service is connected and administrative or system activity is recorded."
          : "The audit service returned no events for the current filters."}
      </p>
      <a
        href="#"
        className="mt-3.5 inline-flex h-9 items-center gap-2 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12px] text-foreground/85 transition-colors hover:bg-accent/60"
      >
        How Audit Logs Work
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}

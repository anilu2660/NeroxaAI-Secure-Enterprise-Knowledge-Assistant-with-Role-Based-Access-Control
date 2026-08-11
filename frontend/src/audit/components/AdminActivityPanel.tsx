import { Link } from "@tanstack/react-router";
import { ChevronRight, ClipboardList, Info } from "lucide-react";
import type { AdminActivityEntry } from "@/api/types";

/**
 * Recent administrative activity. With no audit backend connected the service
 * returns an empty list, so this renders a polished empty state — never
 * invented events.
 */
export function AdminActivityPanel({ entries }: { entries: AdminActivityEntry[] }) {
  return (
    <section className="flex flex-col rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-[15px] font-medium tracking-tight text-foreground">
            Recent Administrative Activity
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Latest admin actions and system events
          </p>
        </div>
        <span
          title="Audit backend not connected — no events are recorded yet."
          className="shrink-0 text-muted-foreground/70"
        >
          <Info className="size-3.5" />
          <span className="sr-only">Audit backend not connected.</span>
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-hairline bg-secondary/20 px-4 py-7 text-center">
            <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-card/60 text-muted-foreground">
              <ClipboardList className="size-5" />
            </span>
            <p className="mt-2.5 text-[13px] text-foreground">No activity available</p>
            <p className="mt-1 max-w-[34ch] text-[11px] leading-relaxed text-muted-foreground">
              Administrative actions and system events will appear here once the audit backend is
              connected.
            </p>
          </div>
        ) : (
          <ul className="flex-1 space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-hairline bg-secondary/25 px-3 py-2"
              >
                <p className="text-[12.5px] text-foreground">{entry.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {entry.actor} · {entry.timeLabel}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/audit"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-secondary/30 px-3 py-2 text-[12.5px] text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          View All Audit Logs
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

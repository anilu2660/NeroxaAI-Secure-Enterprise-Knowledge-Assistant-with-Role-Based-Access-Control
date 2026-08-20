import { Link } from "@tanstack/react-router";
import { Activity, Clock } from "lucide-react";
import type { ActivityEntry } from "@/api/types";

export function RecentActivityPanel({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
      <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
        <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
          <Activity className="size-4.5" />
        </span>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-[11px] text-muted-foreground">Audit logs &amp; query exchanges</p>
        </div>
      </div>

      {entries.length ? (
        <ul className="mt-4 space-y-2.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-2xl border border-hairline bg-secondary/25 p-3 transition-all hover:bg-secondary/45 hover:border-primary/30 shadow-xs"
            >
              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{entry.label}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="size-3 text-muted-foreground/80" />
                  <span>{entry.timeLabel}</span>
                  <span>·</span>
                  <Link
                    to="/assistant"
                    search={{ result: entry.resultId }}
                    className="font-medium text-primary hover:underline underline-offset-2"
                  >
                    View Result
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-hairline/80 bg-secondary/20 p-6 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-2xl border border-hairline bg-secondary/40 text-muted-foreground shadow-xs">
            <Activity className="size-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-foreground">No activity recorded yet</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Your knowledge queries, document uploads, and retrievals will appear here in real-time.
          </p>
        </div>
      )}
    </section>
  );
}

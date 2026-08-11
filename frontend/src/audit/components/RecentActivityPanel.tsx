import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import type { ActivityEntry } from "@/api/types";

export function RecentActivityPanel({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="rounded-2xl border border-hairline bg-card/50 p-4 backdrop-blur-xl">
      <h2 className="font-display text-[13.5px] font-medium text-foreground">Recent activity</h2>
      {entries.length ? (
        <ul className="mt-3 space-y-2.5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
              <div className="min-w-0">
                <p className="truncate text-[12.5px] text-foreground/90">{entry.label}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {entry.timeLabel} ·{" "}
                  <Link
                    to="/assistant"
                    search={{ result: entry.resultId }}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Link to results
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-hairline bg-secondary/20 px-3 py-4">
          <Activity className="size-4 text-muted-foreground" />
          <p className="mt-2 text-[12.5px] text-foreground/85">No activity yet</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Your queries and retrievals will appear here as you work.
          </p>
        </div>
      )}
    </section>
  );
}

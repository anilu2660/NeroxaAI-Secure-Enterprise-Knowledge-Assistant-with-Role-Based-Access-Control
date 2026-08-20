import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  ExternalLink,
  Folder,
  Database,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { AuditEventsTable } from "@/audit/components/AuditEventsTable";
import { useAuth } from "@/auth/auth-context";
import type { AuditEvent, AuditEventQuery } from "@/api/types";
import {
  defaultAuditQuery,
  getAuditFilterOptions,
  getAuditServiceStatus,
  listAuditEvents,
} from "@/api/workspace-service";

export const Route = createFileRoute("/_workspace/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs — NeroxaAI Admin" },
      {
        name: "description",
        content:
          "Administrator audit surface for system activity, access events, document changes, and security events. No audit service is connected in this prototype, so no events are recorded.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Audit Logs — NeroxaAI Admin" },
      {
        property: "og:description",
        content:
          "Audit surface prototype — no audit service is connected, so no events are recorded.",
      },
    ],
  }),
  component: AuditRoute,
});

function AuditRoute() {
  return (
    <RoleGuard role="ADMIN" permission="audit:read">
      <AuditLogsPage />
    </RoleGuard>
  );
}

const selectClass =
  "h-11 w-full appearance-none rounded-2xl border border-hairline/80 bg-secondary/30 pl-9 pr-8 text-[12px] text-foreground/90 outline-none transition-all hover:border-primary/40 hover:bg-secondary/45 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring shadow-xs";

function FilterSelect({
  label,
  icon: Icon,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  icon: typeof Tag;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: string[];
}) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-9 top-1.5 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </span>
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${selectClass} pt-3.5`}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function downloadAuditLogsAsCsv(events: AuditEvent[]) {
  if (!events || events.length === 0) return;
  const headers = ["Timestamp", "Actor", "Role", "Action", "Resource", "Category", "Result", "Severity"];
  const rows = events.map((e) => [
    `"${e.timestampIso}"`,
    `"${e.actorName}"`,
    `"${e.actorRole}"`,
    `"${e.actionLabel.replace(/"/g, '""')}"`,
    `"${e.resourceLabel.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    `"${e.result}"`,
    `"${e.severity}"`,
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `neroxa_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function AuditLogsPage() {
  const { session } = useAuth();
  const admin = session?.user ?? null;

  const [query, setQuery] = useState<AuditEventQuery>(() => defaultAuditQuery());
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const status = useQuery({ queryKey: ["audit-status"], queryFn: getAuditServiceStatus });
  const filters = useQuery({ queryKey: ["audit-filters"], queryFn: getAuditFilterOptions });
  const events = useQuery({
    queryKey: ["audit-events", query],
    queryFn: () => listAuditEvents(query),
  });

  const page = events.data ?? {
    available: false,
    events: [],
    total: 0,
    page: query.page,
    pageSize: query.pageSize,
    status: {
      state: "not_connected" as const,
      label: "Audit service not connected",
      detail: "Audit events will appear here once the audit service is connected.",
    },
  };

  const update = <K extends keyof AuditEventQuery>(key: K, value: AuditEventQuery[K]) =>
    setQuery((current) => ({ ...current, [key]: value, page: 1 }));

  const reset = () => setQuery(defaultAuditQuery());

  const pageCount = Math.max(1, Math.ceil(page.total / page.pageSize));
  const firstRow = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const lastRow = Math.min(page.total, page.page * page.pageSize);
  const canPrev = page.total > 0 && page.page > 1;
  const canNext = page.total > 0 && page.page < pageCount;

  const rangeLabel = useMemo(() => {
    if (!query.fromIso && !query.toIso) return "All available time";
    return `${query.fromIso || "Earliest"} – ${query.toIso || "Latest"}`;
  }, [query.fromIso, query.toIso]);

  return (
    <section className="space-y-5 pb-6 pt-1">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="mt-1 grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-md shadow-primary/20 ring-2 ring-primary/20">
            <ShieldCheck className="size-6 text-primary" />
          </span>
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
              <Link to="/admin" className="transition-colors hover:text-primary">
                Admin Dashboard
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground/90 font-semibold">Audit Logs</span>
            </nav>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Audit Logs
            </h1>
            <p className="mt-1 max-w-[680px] text-[12.5px] leading-relaxed text-muted-foreground">
              Review system activity, administrative actions, access events, document changes, and
              security events for enterprise compliance
              {admin ? ` · reviewed as ${admin.name}, ${admin.department}` : ""}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadAuditLogsAsCsv(page.events)}
          disabled={page.events.length === 0}
          title={page.events.length === 0 ? "No active audit records to export" : "Export logs as CSV"}
          className="flex h-10 items-center gap-2 rounded-2xl border border-hairline/80 bg-secondary/40 px-4 text-[12px] font-semibold text-foreground transition-all hover:bg-secondary/70 hover:border-primary/40 shadow-xs disabled:cursor-not-allowed disabled:opacity-45 active:scale-95"
        >
          <Download className="size-4 text-primary" />
          Export CSV
        </button>
      </header>

      {/* Security Banner Card */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[8px] sm:rounded-[10px] border border-border bg-card p-4 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[13.5px] font-semibold text-foreground">
              Administrative Accountability &amp; Security Review
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              {status.data
                ? status.data.detail
                : "Active audit logging tracks user sign-ins, role changes, and knowledge base mutations."}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-[4px] px-2.5 py-0.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          PostgreSQL Connected
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-[8px] sm:rounded-[10px] border border-border bg-card p-4 shadow-xs">
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_auto] lg:items-center">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              value={query.search}
              onChange={(event) => update("search", event.target.value.slice(0, 120))}
              placeholder="Search events, actions, resources..."
              aria-label="Search audit events"
              className="h-10 w-full rounded-[6px] border border-border bg-secondary/30 pl-9 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/75 outline-none transition-colors hover:border-foreground/30 focus-visible:border-primary"
            />
          </label>

          <div className="relative flex h-10 items-center gap-2 rounded-[6px] border border-border bg-secondary/30 px-3 transition-colors hover:border-foreground/30">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  aria-label="From date"
                  value={query.fromIso}
                  onChange={(event) => update("fromIso", event.target.value)}
                  className="w-full bg-transparent text-[11.5px] text-foreground/90 outline-none"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <input
                  type="date"
                  aria-label="To date"
                  value={query.toIso}
                  onChange={(event) => update("toIso", event.target.value)}
                  className="w-full bg-transparent text-[11.5px] text-foreground/90 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="flex h-10 items-center justify-center gap-1.5 rounded-[6px] border border-border bg-secondary/30 px-4 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary/60 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>

        <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect
            label="Event Type"
            icon={Tag}
            value={query.eventType}
            onChange={(value) => update("eventType", value)}
            allLabel="All Types"
            options={filters.data?.eventTypes ?? []}
          />
          <FilterSelect
            label="Actor / User"
            icon={User}
            value={query.actor}
            onChange={(value) => update("actor", value)}
            allLabel="All Actors"
            options={filters.data?.actors ?? []}
          />
          <FilterSelect
            label="Resource"
            icon={Database}
            value={query.resource}
            onChange={(value) => update("resource", value)}
            allLabel="All Resources"
            options={filters.data?.resources ?? []}
          />
          <FilterSelect
            label="Category"
            icon={Folder}
            value={query.category}
            onChange={(value) => update("category", value)}
            allLabel="All Categories"
            options={filters.data?.categories ?? []}
          />
          <FilterSelect
            label="Result / Status"
            icon={CircleCheck}
            value={query.result}
            onChange={(value) => update("result", value)}
            allLabel="All Results"
            options={filters.data?.results ?? []}
          />
          <FilterSelect
            label="Severity"
            icon={ShieldCheck}
            value={query.severity}
            onChange={(value) => update("severity", value)}
            allLabel="All Severity"
            options={filters.data?.severities ?? []}
          />
        </div>
      </div>

      {/* Audit Table Card */}
      <AuditEventsTable page={page} loading={events.isLoading} onInspect={setSelected} />

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-hairline bg-card/60 px-5 py-3.5 shadow-lg backdrop-blur-2xl">
        <p className="text-[12px] font-medium text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{firstRow}</span> to{" "}
          <span className="font-semibold text-foreground">{lastRow}</span> of{" "}
          <span className="font-semibold text-foreground">{page.total}</span> audit records
        </p>
        <div className="flex items-center gap-2">
          <label className="relative">
            <span className="sr-only">Results per page</span>
            <select
              value={query.pageSize}
              onChange={(event) =>
                update("pageSize", Number(event.target.value) as AuditEventQuery["pageSize"])
              }
              className="h-9 appearance-none rounded-2xl border border-hairline/80 bg-secondary/35 pl-3 pr-7 text-[12px] font-medium text-foreground outline-none transition-all hover:bg-secondary/60"
            >
              {[25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
          <PagerButton
            label="First page"
            icon={ChevronFirst}
            disabled={!canPrev}
            onClick={() => setQuery((current) => ({ ...current, page: 1 }))}
          />
          <PagerButton
            label="Previous page"
            icon={ChevronLeft}
            disabled={!canPrev}
            onClick={() =>
              setQuery((current) => ({ ...current, page: Math.max(1, current.page - 1) }))
            }
          />
          <PagerButton
            label="Next page"
            icon={ChevronRight}
            disabled={!canNext}
            onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
          />
          <PagerButton
            label="Last page"
            icon={ChevronLast}
            disabled={!canNext}
            onClick={() => setQuery((current) => ({ ...current, page: pageCount }))}
          />
        </div>
      </div>

      {selected ? <AuditEventDialog event={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

function PagerButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof ChevronLeft;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-2xl border border-hairline/80 bg-secondary/40 text-foreground transition-all hover:bg-card hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30 shadow-xs active:scale-95"
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Detail view for a real returned event. */
function AuditEventDialog({ event, onClose }: { event: AuditEvent; onClose: () => void }) {
  const rows: Array<[string, string]> = [
    ["Event ID", event.id],
    ["Timestamp", new Date(event.timestampIso).toLocaleString()],
    ["Actor", `${event.actorName} (${event.actorRole})`],
    ["Action / Event", event.actionLabel],
    ["Resource", `${event.resourceLabel} (${event.resourceType} · ${event.resourceId})`],
    ["Category", event.category],
    ["Result / Status", event.result],
    ["Severity", event.severity],
    ...Object.entries(event.metadata),
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Audit event details"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="w-full max-w-[540px] rounded-3xl border border-hairline/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
              <ShieldCheck className="size-4.5" />
            </span>
            <h2 className="font-display text-[16px] font-semibold text-foreground">
              Audit Event Details
            </h2>
          </div>
          <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground border border-hairline">
            {event.category}
          </span>
        </div>

        <dl className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 rounded-xl bg-secondary/20 p-2.5 border border-hairline/50"
            >
              <dt className="w-[130px] shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd className="min-w-0 break-words text-right text-[12px] font-medium text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary px-6 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-110 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

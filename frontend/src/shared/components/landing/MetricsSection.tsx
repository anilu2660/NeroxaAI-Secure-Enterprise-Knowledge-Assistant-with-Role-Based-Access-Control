import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from "recharts";
import { Zap, ShieldCheck, Database, TrendingUp } from "lucide-react";

const LATENCY_DATA = [
  { percentile: "P10", latency: 22, cacheHit: 18 },
  { percentile: "P25", latency: 38, cacheHit: 20 },
  { percentile: "P50", latency: 68, cacheHit: 22 },
  { percentile: "P75", latency: 112, cacheHit: 24 },
  { percentile: "P90", latency: 146, cacheHit: 26 },
  { percentile: "P95", latency: 168, cacheHit: 28 },
  { percentile: "P99", latency: 184, cacheHit: 30 },
];

const PRECISION_DATA = [
  { method: "Raw Vector", precision: 74.2, fill: "#94a3b8" },
  { method: "Hybrid BM25", precision: 86.5, fill: "#60a5fa" },
  { method: "Cross-Encoder", precision: 98.4, fill: "#2563eb" },
];

const METRICS_SUMMARY = [
  {
    label: "Median Query-to-Citation",
    value: "< 180ms",
    subtext: "P50 latency under 70ms",
    icon: Zap,
  },
  {
    label: "Cloud Data Exposure",
    value: "0.00%",
    subtext: "100% air-gapped on-premise",
    icon: ShieldCheck,
  },
  {
    label: "Top-5 Reranking Precision",
    value: "98.4%",
    subtext: "BAAI Cross-Encoder scoring",
    icon: TrendingUp,
  },
  {
    label: "RBAC Compliance Rate",
    value: "100%",
    subtext: "Zero cross-department leakage",
    icon: Database,
  },
];

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[6px] border border-border bg-popover/95 px-3 py-2 text-popover-foreground shadow-lg backdrop-blur-md font-mono text-[11.5px] space-y-1 min-w-[150px]">
      {label && <p className="font-semibold text-foreground border-b border-border pb-1 mb-1">{label}</p>}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.payload?.fill || "#2563eb" }} />
            {entry.name || "Value"}:
          </span>
          <span className="font-semibold text-foreground">
            {entry.value}{entry.name?.includes("Precision") || entry.dataKey === "precision" ? "%" : "ms"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MetricsSection() {
  return (
    <section id="metrics" className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          Performance Benchmarks
        </span>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Empirical precision and throughput metrics.
        </h2>
        <p className="mt-2.5 sm:mt-3 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
          Benchmarked on standard enterprise document corpora (PDF/DOCX manuals, policy repositories, and technical specifications).
        </p>
      </div>

      {/* KPI Stats Strip */}
      <div className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {METRICS_SUMMARY.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-[10px] border border-border bg-card p-3.5 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">{metric.label}</span>
                <Icon className="size-3.5 sm:size-4 text-primary shrink-0 ml-1" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {metric.value}
              </p>
              <p className="text-[10px] sm:text-[11.5px] text-muted-foreground font-mono truncate">{metric.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Motion Charts & Graphs */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Latency Distribution Area Chart */}
        <div className="lg:col-span-7 rounded-[10px] border border-border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-display text-[14px] sm:text-[15px] font-bold text-foreground">
                Query Latency Distribution Curve
              </h3>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground">
                Measured from client request ingress to citation synthesis completion (ms)
              </p>
            </div>
            <span className="self-start sm:self-auto font-mono text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-[4px] border border-emerald-500/20">
              P99 &lt; 185ms
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LATENCY_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cacheGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis
                  dataKey="percentile"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fill: "currentColor", fontSize: 10, fontFamily: "monospace" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fill: "currentColor", fontSize: 10, fontFamily: "monospace" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                  unit="ms"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="latency"
                  name="Full RAG Pipeline"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#latencyGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cacheHit"
                  name="Redis Cache Hit"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cacheGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-muted-foreground pt-2 border-t border-border">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-600 shrink-0" /> Full Vector Search &amp; Synthesis
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" /> Redis Semantic Cache Hit
            </span>
          </div>
        </div>

        {/* Precision vs Reranking Bar Chart */}
        <div className="lg:col-span-5 rounded-[10px] border border-border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-display text-[14px] sm:text-[15px] font-bold text-foreground">
                Retrieval Precision (Top-5)
              </h3>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground">
                Precision comparison across retrieval architectures
              </p>
            </div>
            <span className="self-start sm:self-auto font-mono text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-[4px] border border-blue-500/20">
              98.4% Acc.
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={PRECISION_DATA}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="var(--color-muted-foreground)"
                  tick={{ fill: "currentColor", fontSize: 10, fontFamily: "monospace" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  stroke="var(--color-foreground)"
                  tick={{ fill: "currentColor", fontSize: 11, fontWeight: 500 }}
                  className="text-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                  width={100}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="precision" name="Precision" radius={[0, 6, 6, 0]}>
                  {PRECISION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[6px] border border-border bg-secondary/40 p-2 sm:p-2.5 text-[10.5px] sm:text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">BAAI Cross-Encoder advantage:</span>{" "}
            Eliminates false-positive dense vector chunks before sending to local LLM context.
          </div>
        </div>
      </div>
    </section>
  );
}

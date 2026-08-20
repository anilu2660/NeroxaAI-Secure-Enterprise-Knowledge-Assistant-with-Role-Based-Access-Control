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
} from "recharts";
import { Zap, ShieldCheck, Database, CheckCircle2, TrendingUp } from "lucide-react";

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
  { method: "Raw Vector Search", precision: 74.2, fill: "#64748b" },
  { method: "Hybrid Dense+BM25", precision: 86.5, fill: "#94a3b8" },
  { method: "Neroxa Cross-Encoder", precision: 98.4, fill: "#2563eb" },
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

export function MetricsSection() {
  return (
    <section id="metrics" className="relative mx-auto w-full max-w-[1280px] px-6 py-16">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          Performance Benchmarks
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Empirical precision and throughput metrics.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Benchmarked on standard enterprise document corpora (PDF/DOCX manuals, policy repositories, and technical specifications).
        </p>
      </div>

      {/* KPI Stats Strip */}
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS_SUMMARY.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-[10px] border border-border bg-card p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{metric.label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                {metric.value}
              </p>
              <p className="text-[11.5px] text-muted-foreground font-mono">{metric.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Motion Charts & Graphs */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latency Distribution Area Chart */}
        <div className="lg:col-span-7 rounded-[10px] border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-[15px] font-bold text-foreground">
                Query Latency Distribution Curve
              </h3>
              <p className="text-[12px] text-muted-foreground">
                Measured from client request ingress to citation synthesis completion (ms)
              </p>
            </div>
            <span className="font-mono text-[11px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-[4px]">
              P99 &lt; 185ms
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LATENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cacheGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="percentile"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  unit="ms"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  name="Full RAG Pipeline"
                  stroke="#2563eb"
                  strokeWidth={2}
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

          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-600" /> Full Vector Search &amp; Synthesis
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Redis Semantic Cache Hit
            </span>
          </div>
        </div>

        {/* Precision vs Reranking Bar Chart */}
        <div className="lg:col-span-5 rounded-[10px] border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-[15px] font-bold text-foreground">
                Retrieval Precision (Top-5)
              </h3>
              <p className="text-[12px] text-muted-foreground">
                Precision comparison across retrieval architectures
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={PRECISION_DATA}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                  formatter={(value: number) => [`${value}%`, "Accuracy"]}
                />
                <Bar dataKey="precision" radius={[0, 4, 4, 0]}>
                  {PRECISION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[6px] border border-border bg-secondary/30 p-2.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">BAAI Cross-Encoder advantage:</span>{" "}
            Eliminates false-positive dense vector chunks before sending to Ollama.
          </div>
        </div>
      </div>
    </section>
  );
}

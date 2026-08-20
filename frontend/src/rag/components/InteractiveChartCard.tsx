import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ChartConfig {
  title?: string;
  description?: string;
  type?: "bar" | "area" | "pie" | "table";
  unit?: string;
  data: ChartDataPoint[];
  keys?: string[];
  colors?: string[];
}

const PALETTE = [
  "#38bdf8", // Sky
  "#a855f7", // Purple
  "#34d399", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#6366f1", // Indigo
];

export function InteractiveChartCard({ config }: { config: ChartConfig }) {
  const [viewMode, setViewMode] = useState<"bar" | "area" | "pie" | "table">(
    config.type || "bar",
  );
  const [copied, setCopied] = useState(false);

  const data = config.data || [];
  const unit = config.unit || "";

  // Infer numerical keys if not explicitly provided
  const keys = useMemo(() => {
    if (config.keys && config.keys.length > 0) return config.keys;
    if (!data.length) return ["value"];
    const first = data[0];
    if (!first) return ["value"];
    return Object.keys(first).filter((k) => k !== "name" && typeof first[k] === "number");
  }, [config.keys, data]);

  const colors = config.colors || PALETTE;

  const handleCopyCsv = async () => {
    if (!data.length) return;
    const header = ["Name", ...keys].join(",");
    const rows = data.map((d) => [d.name, ...keys.map((k) => d[k] ?? "")].join(","));
    const csv = [header, ...rows].join("\n");
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="my-3.5 overflow-hidden rounded-3xl border border-hairline/80 bg-gradient-to-b from-card/90 via-card/65 to-card/95 p-4 shadow-xl backdrop-blur-2xl transition-all duration-300">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-hairline/60">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            <h4 className="font-display text-[13.5px] font-bold tracking-tight text-foreground truncate">
              {config.title || "Interactive Data Visualizer"}
            </h4>
          </div>
          {config.description ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              {config.description}
            </p>
          ) : null}
        </div>

        {/* View Switcher Pills & Copy CSV */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-xl border border-hairline/70 bg-secondary/30 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("bar")}
              title="Bar Chart"
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                viewMode === "bar"
                  ? "bg-primary/20 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="size-3" />
              <span className="hidden sm:inline">Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("area")}
              title="Area Trend"
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                viewMode === "area"
                  ? "bg-primary/20 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LineChartIcon className="size-3" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pie")}
              title="Distribution"
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                viewMode === "pie"
                  ? "bg-primary/20 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PieChartIcon className="size-3" />
              <span className="hidden sm:inline">Donut</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Data Table"
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-primary/20 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="size-3" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyCsv}
            title="Copy as CSV"
            className="flex items-center gap-1 rounded-xl border border-hairline/70 bg-secondary/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart Canvas / Table Container */}
      <div className="pt-3">
        {viewMode === "bar" && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(val) => `${unit}${val.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-2xl border border-hairline bg-card/95 p-2.5 shadow-2xl backdrop-blur-xl">
                        <p className="font-display text-[12px] font-bold text-foreground">
                          {label}
                        </p>
                        <div className="mt-1 space-y-1">
                          {payload.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 text-[11.5px]">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                {String(item.name).toUpperCase()}
                              </span>
                              <span className="font-bold text-foreground">
                                {unit}
                                {Number(item.value).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />}
                {keys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[idx % colors.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === "area" && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <defs>
                  {keys.map((key, idx) => {
                    const color = colors[idx % colors.length] || PALETTE[0];
                    return (
                      <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(val) => `${unit}${val.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-2xl border border-hairline bg-card/95 p-2.5 shadow-2xl backdrop-blur-xl">
                        <p className="font-display text-[12px] font-bold text-foreground">{label}</p>
                        <div className="mt-1 space-y-1">
                          {payload.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 text-[11.5px]">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {String(item.name).toUpperCase()}
                              </span>
                              <span className="font-bold text-foreground">
                                {unit}{Number(item.value).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />}
                {keys.map((key, idx) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#grad_${key})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === "pie" && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey={keys[0] || "value"}
                  nameKey="name"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      stroke="rgba(0,0,0,0.4)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    return (
                      <div className="rounded-2xl border border-hairline bg-card/95 p-2.5 shadow-2xl backdrop-blur-xl">
                        <p className="font-display text-[12px] font-bold text-foreground">
                          {item?.name}
                        </p>
                        <p className="text-[12px] font-bold text-primary mt-0.5">
                          {unit}
                          {Number(item?.value).toLocaleString()}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === "table" && (
          <div className="overflow-x-auto rounded-2xl border border-hairline/60 bg-secondary/15">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-hairline/60 bg-secondary/40 font-semibold text-foreground">
                <tr>
                  <th className="px-3.5 py-2.5">Category / Name</th>
                  {keys.map((k) => (
                    <th key={k} className="px-3.5 py-2.5 text-right capitalize">
                      {k} ({unit || "Val"})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/40">
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-secondary/25 transition-colors"
                  >
                    <td className="px-3.5 py-2 font-medium text-foreground">
                      {row.name}
                    </td>
                    {keys.map((k) => (
                      <td key={k} className="px-3.5 py-2 text-right font-mono text-muted-foreground">
                        {unit}
                        {typeof row[k] === "number" ? Number(row[k]).toLocaleString() : row[k]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

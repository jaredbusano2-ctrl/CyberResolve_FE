import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { getAnalytics } from "../services/analyticsService";
import type { AnalyticsPayload } from "../interfaces";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc4444",
  high: "#2563eb",
  medium: "#c2871f",
  low: "#2f9e6e",
};

const STATUS_ORDER = ["new", "investigating", "contained", "eradicated", "recovering", "closed"] as const;
const STATUS_LABELS: Record<string, string> = {
  new: "New",
  investigating: "Investigating",
  contained: "Contained",
  eradicated: "Eradicated",
  recovering: "Recovering",
  closed: "Closed",
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

function formatHours(hours: number): string {
  if (hours <= 0) return "0h";
  return `${hours.toFixed(1)}h`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "#ffffff", border: `1px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(60,45,30,0.12)" }}>
      <p className="font-semibold mb-1" style={{ color: "#4a453e" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.stroke }}>{p.name}: <span className="font-bold" style={{ color: "#241f1b" }}>{p.value}</span></p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    getAnalytics()
      .then(payload => {
        if (!active) return;
        setData(payload);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load analytics from the server.");
        setData(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const overview = data?.overview;
  const analytics = data?.incidentAnalytics;

  const trendData = useMemo(
    () => analytics?.monthlyTrend ?? [],
    [analytics],
  );

  const responseTimeData = useMemo(
    () => analytics?.performanceTrend.map(point => ({
      month: point.month,
      response: point.responseMinutes,
      resolution: point.resolutionHours,
    })) ?? [],
    [analytics],
  );

  const severityDist = useMemo(
    () => Object.entries(analytics?.bySeverity ?? {}).map(([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[normalizeKey(name)] ?? "#64748b",
    })),
    [analytics],
  );

  const categoryData = useMemo(
    () => Object.entries(analytics?.byCategory ?? {}).map(([name, count], index) => ({
      name,
      count,
      color: ["#b25b28", "#15803d", "#3f6b7a", "#c2871f", "#7c3aed", "#0d9488", "#7a746c"][index % 7],
    })),
    [analytics],
  );

  const lifecycleCounts = useMemo(
    () => STATUS_ORDER.map(status => {
      const label = STATUS_LABELS[status] ?? status;
      return analytics?.byStatus[label] ?? analytics?.byStatus[status] ?? 0;
    }),
    [analytics],
  );

  const maxLifecycleCount = Math.max(...lifecycleCounts, 1);
  const maxSeverityCount = Math.max(...severityDist.map(item => item.value), 1);

  const cards = [
    { icon: AlertTriangle, label: "Total Incidents YTD", value: String(overview?.totalIncidents ?? 0), sub: `${overview?.criticalIncidents ?? 0} critical`, color: "#c2871f" },
    { icon: Clock, label: "Avg Response Time", value: formatMinutes(overview?.averageResponseMinutes ?? 0), sub: "From report to first assignment", color: "#b25b28" },
    { icon: TrendingUp, label: "Avg Resolution Time", value: formatHours(overview?.averageResolutionHours ?? 0), sub: "From report to resolution", color: "#3f6b7a" },
    { icon: CheckCircle2, label: "Resolution Rate", value: `${(overview?.resolutionRate ?? 0).toFixed(1)}%`, sub: `${overview?.resolvedIncidents ?? 0} resolved incidents`, color: "#15803d" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Analytics Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Security metrics, trends, and performance KPIs</p>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-xl p-5 text-sm" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#9b9186" }}>
          Loading real analytics from the database...
        </div>
      ) : null}

      {/* Two-column: main trend content + KPI/severity rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Lifecycle - moved up as the overview strip */}
          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Ticket Lifecycle Distribution</h2>
            <p className="text-xs mb-5" style={{ color: "#9b9186" }}>Current ticket count at each lifecycle stage</p>
            <div className="flex items-end justify-between gap-4">
              {STATUS_ORDER.map((s, i) => {
                const count = lifecycleCounts[i] ?? 0;
                const colors = ["#b25b28", "#0d9488", "#3f6b7a", "#c2871f", "#15803d", "#7a746c"];
                const color = colors[i] ?? "#7a746c";
                const pct = Math.max((count / maxLifecycleCount) * 100, 10);
                return (
                  <div key={s} className="flex-1 flex flex-col items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: "#241f1b" }}>{count}</span>
                    <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}px`, background: `${color}`, minHeight: "10px", maxHeight: "80px" }} />
                    <div className="flex flex-col items-center">
                      {i < STATUS_ORDER.length - 1 && (
                        <div className="text-xs mb-1" style={{ color: "#c9c2b8" }}>→</div>
                      )}
                      <span className="text-xs text-center whitespace-nowrap" style={{ color }}>{STATUS_LABELS[s]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Trend */}
          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Incident Trends</h2>
            <p className="text-xs mb-5" style={{ color: "#9b9186" }}>Monthly incident volume, resolved cases, and critical incidents</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  {[{ id: "inc", color: "#b25b28" }, { id: "res", color: "#15803d" }].map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={g.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,31,27,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#7a746c", paddingTop: "12px" }} />
                <Area type="monotone" dataKey="incidents" name="Total Incidents" stroke="#b25b28" fill="url(#inc)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#15803d" fill="url(#res)" strokeWidth={2} />
                <Line type="monotone" dataKey="critical" name="Critical" stroke="#dc4444" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "#dc4444", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right rail: KPIs + Severity */}
        <div className="space-y-4">
          {cards.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${k.color}18`, border: `1px solid ${k.color}30` }}>
                  <Icon className="h-4 w-4" style={{ color: k.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold leading-tight" style={{ color: "#241f1b" }}>{k.value}</p>
                  <p className="text-xs" style={{ color: "#9b9186" }}>{k.label}</p>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Severity Breakdown</h2>
            <p className="text-xs mb-4" style={{ color: "#9b9186" }}>Distribution by severity</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={severityDist} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {severityDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {severityDist.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs" style={{ color: "#7a746c" }}>{s.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: "#241f1b" }}>{s.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(36,31,27,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max((s.value / maxSeverityCount) * 100, 6)}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Category + Response/Resolution paired */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Category Breakdown</h2>
          <p className="text-xs mb-4" style={{ color: "#9b9186" }}>Incidents by attack type</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,31,27,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#a89e92", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#7a746c", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Response & Resolution Performance</h2>
          <p className="text-xs mb-4" style={{ color: "#9b9186" }}>Avg response (min) and resolution (hrs)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,31,27,0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#7a746c", paddingTop: "12px" }} />
              <Line yAxisId="left" type="monotone" dataKey="response" name="Avg Response (min)" stroke="#c2871f" strokeWidth={2} dot={{ fill: "#c2871f", r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="resolution" name="Avg Resolution (hrs)" stroke="#b25b28" strokeWidth={2} dot={{ fill: "#b25b28", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

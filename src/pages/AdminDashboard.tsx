import { useEffect, useState } from "react";
import {
  Users, Ticket, CheckCircle2, Clock, Activity,
  Archive, ShieldAlert, TrendingUp, ChevronRight, ArrowUpRight, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useCyberResolve, severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import { getDashboard } from "../services/dashboardService";
import { listIncidents } from "../services/incidentService";
import { listUsers } from "../services/userService";
import type { DashboardPayload, Incident, User } from "../interfaces";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "#ffffff", border: `1px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(60,45,30,0.12)" }}>
      <p className="font-semibold" style={{ color: "#4a453e" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span style={{ color: "#241f1b" }}>{p.value}</span></p>
      ))}
    </div>
  );
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <AlertCircle className="h-12 w-12 mb-3" style={{ color: "#c9c2b8" }} />
      <p className="text-sm" style={{ color: "#9b9186" }}>{message}</p>
    </div>
  );
}

// Helper function to generate monthly trend data
function generateMonthlyTrend(incidents: Incident[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const last6Months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      month: months[date.getMonth()],
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
    });
  }

  return last6Months.map(({ month, year, monthIndex }) => {
    const monthIncidents = incidents.filter((inc) => {
      const createdDateValue = inc.occurred_at ?? inc.created_at;
      if (!createdDateValue) {
        return false;
      }

      const createdDate = new Date(createdDateValue);
      return createdDate.getMonth() === monthIndex && createdDate.getFullYear() === year;
    });

    return {
      month,
      open: monthIncidents.filter((t) => t.status?.slug === "open").length,
      resolved: monthIncidents.filter((t) => t.status?.slug === "resolved").length,
      critical: monthIncidents.filter((t) => t.severity === "critical").length,
    };
  });
}

// Helper function to generate category distribution
function generateCategoryDistribution(incidents: Incident[]) {
  const categoryMap: Record<string, number> = {};

  incidents.forEach((inc) => {
    const category = inc.category?.name || "Uncategorized";
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });

  return Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delta,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  delta?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {delta && (
          <span className="flex items-center gap-0.5 text-xs" style={{ color: "#15803d" }}>
            <ArrowUpRight className="h-3 w-3" />
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: "#241f1b" }}>{value}</p>
      <p className="text-xs" style={{ color: "#9b9186" }}>{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { navigate } = useCyberResolve();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboard, incidentResponse, usersResponse] = await Promise.all([
          getDashboard(),
          listIncidents({ page: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
          listUsers({ page: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
        ]);

        if (!active) return;

        setDashboardData(dashboard);
        setIncidents(incidentResponse.data || []);
        setUsers(usersResponse.data || []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Unable to load dashboard data");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Calculate statistics from real data
  const stats = {
    users: users.length,
    total: dashboardData?.widgets.totalIncidents || 0,
    open: dashboardData?.widgets.openIncidents || 0,
    assigned: incidents.filter((t) => t.status?.slug === "assigned").length,
    inProgress: incidents.filter((t) => t.status?.slug === "in_progress").length,
    resolved: dashboardData?.widgets.resolvedIncidents || 0,
    closed: incidents.filter((t) => t.status?.slug === "closed").length,
    critical: dashboardData?.widgets.criticalIncidents || 0,
  };

  // Generate monthly trend data from incidents
  const monthlyData = generateMonthlyTrend(incidents);
  const hasMonthlyData = monthlyData.some((d) => d.open > 0 || d.resolved > 0 || d.critical > 0);

  // Generate severity distribution from dashboard data
  const severityData = Object.entries(dashboardData?.securityMetrics.severityBreakdown || {}).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color:
        name === "critical"
          ? "#dc4444"
          : name === "high"
          ? "#2563eb"
          : name === "medium"
          ? "#c2871f"
          : "#2f9e6e",
    })
  );
  const hasSeverityData = severityData.length > 0 && severityData.some((d) => d.value > 0);

  // Generate category distribution from incidents
  const categoryData = generateCategoryDistribution(incidents);
  const hasCategoryData = categoryData.length > 0 && categoryData.some((d) => d.count > 0);

  const recentTickets = incidents.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Security Operations Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Administrator Dashboard · Real-time incident monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("ticket-management")}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#b25b28", color: "#fff8f2" }}>
            + New Ticket
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl p-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-sm" style={{ color: "#9b9186" }}>Loading dashboard data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl p-4" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.22)" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{error}</p>
        </div>
      )}

      {/* Stat grid - back on top as the primary KPI row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard icon={Users} label="Total Users" value={stats.users} color="#b25b28" />
          <StatCard icon={Ticket} label="Total Incidents" value={stats.total} color="#b25b28" />
          <StatCard icon={Clock} label="Open" value={stats.open} color="#c2871f" />
          <StatCard icon={Activity} label="Assigned" value={stats.assigned} color="#3f6b7a" />
          <StatCard icon={TrendingUp} label="In Progress" value={stats.inProgress} color="#2563eb" />
          <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="#15803d" />
          <StatCard icon={Archive} label="Closed" value={stats.closed} color="#7a746c" />
          <StatCard icon={ShieldAlert} label="Critical" value={stats.critical} color="#dc4444" />
        </div>
      )}

      {/* Trend + Severity, paired together */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Monthly Incident Trends</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9b9186" }}>Open vs Resolved vs Critical</p>
              </div>
              <span className="text-xs font-mono" style={{ color: "#a89e92" }}>Last 6 Months</span>
            </div>
            {!hasMonthlyData ? (
              <EmptyChart message="No incident data available yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b25b28" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#b25b28" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,31,27,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#a89e92", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#7a746c" }} />
                  <Area type="monotone" dataKey="open" name="Open" stroke="#b25b28" fill="url(#openGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#15803d" fill="url(#resolvedGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="critical" name="Critical" stroke="#dc4444" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Severity Distribution</h2>
            <p className="text-xs mb-4" style={{ color: "#9b9186" }}>Current active incidents</p>
            {!hasSeverityData ? (
              <EmptyChart message="No severity data available" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" strokeWidth={0}>
                      {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {severityData.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-xs" style={{ color: "#7a746c" }}>{s.name}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: "#241f1b" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Category + Recent Incidents, paired together */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Incident Categories</h2>
            <p className="text-xs mb-4" style={{ color: "#9b9186" }}>Distribution by type</p>
            {!hasCategoryData ? (
              <EmptyChart message="Waiting for incident records" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical" barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,31,27,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#a89e92", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#7a746c", fontSize: 10 }} axisLine={false} tickLine={false} width={85} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Incidents" fill="#b25b28" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Recent Incidents</h2>
              <button onClick={() => navigate("ticket-management")} className="text-xs flex items-center gap-1" style={{ color: "#94481d" }}>
                Manage All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["ID", "Title", "Category", "Severity", "Status", "Analyst"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#a89e92" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#a89e92" }}>
                        No incidents reported yet
                      </td>
                    </tr>
                  ) : recentTickets.map((t, i) => (
                    <tr key={t.id} className="transition-colors cursor-pointer hover:bg-[rgba(178,91,40,0.04)]"
                      style={{ borderBottom: i < recentTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}
                      onClick={() => navigate("ticket-management")}>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "#94481d" }}>#{t.id}</td>
                      <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: "#4a453e" }}>{t.title}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>{t.category?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(t.severity)}`}>
                          {t.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(t.status?.slug ?? "")}`}>
                          {statusLabel(t.status?.slug ?? "")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9b9186" }}>{t.current_assignee?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

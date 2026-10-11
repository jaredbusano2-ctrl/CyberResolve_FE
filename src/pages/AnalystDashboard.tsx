import { useEffect, useState } from "react";
import { Eye, CheckCircle2, Activity, AlertTriangle, ChevronRight, Target, Zap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useCyberResolve, severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces";

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

function generateWeeklyActivity(incidents: Incident[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const now = new Date();
  
  // Get start of current week (Monday)
  const currentDay = now.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // adjust when day is Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return days.map((day, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
    const nextDay = new Date(dayDate);
    nextDay.setDate(dayDate.getDate() + 1);

    const dayIncidents = incidents.filter((inc) => {
      const resolvedDate = inc.resolved_at ? new Date(inc.resolved_at) : null;
      const updatedDate = new Date(inc.updated_at ?? inc.reported_at);
      const statusSlug = inc.status?.slug ?? "";
      
      return (
        (resolvedDate && resolvedDate >= dayDate && resolvedDate < nextDay) ||
        (updatedDate >= dayDate && updatedDate < nextDay && statusSlug === "in_progress")
      );
    });

    return {
      day,
      resolved: dayIncidents.filter((inc) => inc.status?.slug === "resolved").length,
      reviewed: dayIncidents.filter((inc) => inc.status?.slug === "in_progress" || inc.status?.slug === "pending").length,
    };
  });
}

export default function AnalystDashboard() {
  const { currentUser, navigate } = useCyberResolve();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const response = await listIncidents({ assigned_to_me: true });
        
        if (!active) return;
        
        setIncidents(response.data || []);
      } catch {
        if (!active) return;
        setIncidents([]);
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
  }, [currentUser]);

  const assignedTickets = incidents;
  const activeInvestigations = assignedTickets.filter((t: Incident) => t.status?.slug === "in_progress" || t.status?.slug === "assigned");
  
  // Calculate resolved this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const resolved = assignedTickets.filter((t: any) => {
    const resolvedAt = t.resolved_at ? new Date(t.resolved_at) : null;
    const statusSlug = t.status?.slug ?? "";
    return (statusSlug === "resolved" || statusSlug === "closed") && resolvedAt && resolvedAt >= firstDayOfMonth;
  });
  
  const criticals = assignedTickets.filter((t: Incident) => t.severity === "critical");
  
  const workloadData = generateWeeklyActivity(assignedTickets);
  const hasWorkloadData = workloadData.some((d) => d.resolved > 0 || d.reviewed > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Security Analyst Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>{currentUser?.name ?? "Analyst"} · SOC Level 2 · Active Session</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(63,107,122,0.08)", border: "1px solid rgba(63,107,122,0.22)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3f6b7a" }} />
            <span className="text-xs font-semibold" style={{ color: "#2c5563" }}>ON DUTY</span>
          </div>
          <button onClick={() => navigate("assigned-tickets")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#3f6b7a" }}>
            <Eye className="h-4 w-4" />
            View Assigned Tickets
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl p-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-sm" style={{ color: "#9b9186" }}>Loading your assignments...</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Target, label: "Assigned Tickets", value: assignedTickets.length, color: "#b25b28" },
            { icon: Activity, label: "Active Investigations", value: activeInvestigations.length, color: "#3f6b7a" },
            { icon: CheckCircle2, label: "Resolved This Month", value: resolved.length, color: "#15803d" },
            { icon: AlertTriangle, label: "Critical Incidents", value: criticals.length, color: "#dc4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: "#241f1b" }}>{s.value}</p>
                <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned tickets */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: "#3f6b7a" }} />
                <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>My Assigned Tickets</h2>
              </div>
              <button onClick={() => navigate("assigned-tickets")} className="text-xs flex items-center gap-1" style={{ color: "#94481d" }}>
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Ticket ID", "Title", "Category", "Severity", "Priority", "Status", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#a89e92" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "#a89e92" }}>No assigned tickets yet</td>
                    </tr>
                  ) : assignedTickets.slice(0, 5).map((t: Incident, i: number) => {
                    const priority = t.severity === "critical" ? "High" : t.severity === "high" ? "High" : t.severity === "medium" ? "Medium" : "Low";
                    const priorityColor = priority === "High" ? "#dc4444" : priority === "Medium" ? "#c2871f" : "#2f9e6e";
                    const statusSlug = t.status?.slug ?? "";
                    
                    return (
                      <tr key={t.id} className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                        style={{ borderBottom: i < assignedTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "#94481d" }}>#{t.id}</td>
                        <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: "#4a453e" }}>{t.title}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9b9186" }}>{t.category?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(t.severity)}`}>
                            {t.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold" style={{ color: priorityColor }}>
                            {priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(statusSlug)}`}>
                            {statusLabel(statusSlug)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigate("investigation")}
                            className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#3f6b7a" }}>
                            <Eye className="h-3 w-3" /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Workload chart */}
            <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "#241f1b" }}>Weekly Activity</h3>
              <p className="text-xs mb-3" style={{ color: "#9b9186" }}>Resolved vs Reviewed</p>
              {!hasWorkloadData ? (
                <div className="h-[110px] flex items-center justify-center">
                  <p className="text-xs" style={{ color: "#a89e92" }}>No investigation data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={workloadData} barSize={8}>
                    <XAxis dataKey="day" tick={{ fill: "#a89e92", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#a89e92", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="resolved" name="Resolved" fill="#15803d" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="reviewed" name="Reviewed" fill="#b25b28" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* SLA status */}
            <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4" style={{ color: "#c2871f" }} />
                <h3 className="font-semibold text-sm" style={{ color: "#241f1b" }}>SLA Status</h3>
              </div>
              {assignedTickets.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "#a89e92" }}>No active tickets</p>
              ) : (
                assignedTickets.slice(0, 3).map((t: Incident) => {
                  // Calculate time-based SLA (mock calculation)
                  const createdDate = new Date(t.created_at ?? t.reported_at);
                  const now = new Date();
                  const hoursPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
                  const slaHours = t.severity === "critical" ? 4 : t.severity === "high" ? 8 : t.severity === "medium" ? 24 : 48;
                  const pct = Math.min((hoursPassed / slaHours) * 100, 100);
                  const remaining = Math.max(slaHours - hoursPassed, 0);
                  const color = pct >= 90 ? "#dc4444" : pct >= 60 ? "#c2871f" : "#15803d";
                  const label = pct >= 100 ? "URGENT" : `${remaining}h remaining`;

                  return (
                    <div key={t.id} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono" style={{ color: "#94481d" }}>#{t.id}</span>
                        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(36,31,27,0.08)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

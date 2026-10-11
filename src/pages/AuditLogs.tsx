import { useEffect, useState } from "react";
import { BookOpen, Search, Download, ChevronDown, Shield, AlertCircle } from "lucide-react";
import { listAuditLogs } from "../services/auditLogService";
import type { AuditEntry } from "../contexts/CyberResolveContext";
import type { AuditLog } from "../interfaces/auditLog";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const activityColor = (type: string) => {
  if (type === "Security Alert") return "text-red-700 bg-red-50 border-red-200";
  if (type === "Authentication") return "text-orange-700 bg-orange-50 border-orange-200";
  if (type === "User Management") return "text-purple-700 bg-purple-50 border-purple-200";
  if (type === "Ticket Update" || type === "Ticket Resolution" || type === "Ticket Assignment") return "text-cyan-700 bg-cyan-50 border-cyan-200";
  if (type === "Investigation") return "text-amber-700 bg-amber-50 border-amber-200";
  if (type === "Incident Report") return "text-blue-700 bg-blue-50 border-blue-200";
  return "text-stone-600 bg-stone-100 border-stone-200";
};

const activityTypes = ["Security Alert", "Authentication", "User Management", "Ticket Update", "Ticket Resolution", "Ticket Assignment", "Investigation", "Incident Report", "Report Export"];

type ApiAuditEntry = AuditLog & { user?: { email: string } | null };

function getActivityType(action: string, entityType: string | null): string {
  if (action.startsWith("auth.")) return "Authentication";
  if (action.startsWith("user.")) return "User Management";
  if (action.startsWith("incident.")) return "Incident Report";
  if (action.startsWith("report.")) return "Report Export";
  if (action.startsWith("profile.")) return "User Management";
  if (action.includes("failed") || action.includes("lock")) return "Security Alert";
  return entityType === "audit_log" ? "Audit Event" : "Security Alert";
}

function formatAuditDetails(log: AuditLog): string {
  if (log.metadata && Object.keys(log.metadata).length > 0) {
    return Object.entries(log.metadata)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
      .join(" · ");
  }

  if (log.entity_type || log.entity_id) {
    return `${log.entity_type ?? ""}${log.entity_id ? ` #${log.entity_id}` : ""}`.trim();
  }

  return "";
}

function mapAuditLog(log: ApiAuditEntry): AuditEntry {
  return {
    id: String(log.id),
    user: log.user?.email ?? "system",
    action: log.action,
    activityType: getActivityType(log.action, log.entity_type),
    timestamp: log.created_at ? new Date(log.created_at).toLocaleString() : "Unknown",
    ipAddress: log.ip_address ?? "N/A",
    details: formatAuditDetails(log),
  };
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await listAuditLogs({ page, per_page: 10 });
        if (!active) return;

        setLogs(response.data.map(mapAuditLog));
        setLastPage(response.last_page);
        setTotalEvents(response.total);
      } catch (err: unknown) {
        if (!active) return;
        console.error("Failed to load audit logs:", err);
        setError("Unable to load audit logs from the database.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      active = false;
    };
  }, [page]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (
      (l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.ipAddress.includes(q)) &&
      (filterType === "all" || l.activityType === filterType)
    );
  });

  const handleExport = () => {
    const headers = ["ID", "User", "Action", "Activity Type", "Timestamp", "IP Address", "Details"];
    const rows = filtered.map(l => [l.id, l.user, l.action, l.activityType, l.timestamp, l.ipAddress, l.details]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Audit Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Immutable activity log · All actions recorded for compliance</p>
        </div>
        <button onClick={handleExport} disabled={filtered.length === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#15803d" }}>
          <Download className="h-4 w-4" /> Export Logs
        </button>
      </div>

      {/* Security alert banner - moved to top, most urgent info first */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: "rgba(185,28,28,0.05)", border: "1px solid rgba(185,28,28,0.16)" }}>
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#b91c1c" }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: "#b91c1c" }}>Security Alert Detected</p>
          <p className="text-xs mt-0.5" style={{ color: "#9b9186" }}>5 failed login attempts from IP 203.0.113.99 detected at 03:12. Account temporarily locked. Investigation recommended.</p>
        </div>
      </div>

      {/* Combined stats + filters toolbar */}
      <div className="rounded-xl p-4 flex flex-col xl:flex-row xl:items-center gap-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-5 xl:pr-5 xl:border-r" style={{ borderColor: BORDER }}>
          {[
            { label: "Total", value: totalEvents, color: "#b25b28" },
            { label: "Alerts", value: logs.filter(l => l.activityType === "Security Alert").length, color: "#dc4444" },
            { label: "Auth", value: logs.filter(l => l.activityType === "Authentication").length, color: "#15803d" },
            { label: "Today", value: 4, color: "#b25b28" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9b9186" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9b9186" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, action, or IP address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
          </div>
          <div className="relative">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
              <option value="all">All Activity Types</option>
              {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
          <BookOpen className="h-4 w-4" style={{ color: "#b25b28" }} />
          <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Activity Log</h2>
          <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "#15803d" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#15803d" }} /> Live · {filtered.length} entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["#", "User", "Action", "Activity Type", "Timestamp", "IP Address"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#a89e92" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "#a89e92" }}>Loading audit logs...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "#b91c1c" }}>{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "#a89e92" }}>No audit events available.</td>
                </tr>
              ) : filtered.map((l, i) => (
                <tr key={l.id} className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "#c9c2b8" }}>{l.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: l.user === "unknown" ? "rgba(185,28,28,0.08)" : "rgba(178,91,40,0.08)" }}>
                        <Shield className="h-3 w-3" style={{ color: l.user === "unknown" ? "#b91c1c" : "#b25b28" }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: l.user === "unknown" ? "#b91c1c" : "#4a453e" }}>{l.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[260px]" style={{ color: "#4a453e" }}>
                    <p className="truncate">{l.action}</p>
                    {l.details && <p className="text-xs mt-0.5 font-mono truncate" style={{ color: "#9b9186" }}>{l.details}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap ${activityColor(l.activityType)}`}>
                      {l.activityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: "#9b9186" }}>{l.timestamp}</td>
                  <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: "#9b9186" }}>{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: `1px solid ${BORDER}`, background: CARD }}>
          <div className="text-xs" style={{ color: "#9b9186" }}>
            Showing {logs.length} entries on this page · {totalEvents} total events
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "rgba(36,31,27,0.04)", color: "#4a453e", border: `1px solid ${BORDER}` }}>
              Previous
            </button>
            <span className="text-xs" style={{ color: "#4a453e" }}>Page {page} of {lastPage}</span>
            <button
              type="button"
              onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
              disabled={page === lastPage || loading}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "rgba(36,31,27,0.04)", color: "#4a453e", border: `1px solid ${BORDER}` }}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { FileText, Download, Filter, ChevronDown, BarChart2, CheckCircle2, Calendar, Shield } from "lucide-react";
import { severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import { listIncidents } from "../services/incidentService";
import { getLookups } from "../services/lookupService";
import type { Incident, IncidentStatus, SeverityLevel } from "../interfaces/incident";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const REPORT_TYPES = [
  { id: "incident", label: "Incident Report", icon: Shield, color: "#b25b28", desc: "Full details of all incidents within the selected period" },
  { id: "severity", label: "Severity Report", icon: Filter, color: "#dc4444", desc: "Breakdown of incidents by severity level" },
  { id: "monthly", label: "Monthly Summary", icon: Calendar, color: "#3f6b7a", desc: "Monthly overview of incidents, trends, and KPIs" },
  { id: "resolution", label: "Resolution Report", icon: CheckCircle2, color: "#15803d", desc: "Analysis of resolution times and outcomes" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("incident");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | "all">("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [reportIncidents, setReportIncidents] = useState<Incident[]>([]);
  const [incidentStatuses, setIncidentStatuses] = useState<IncidentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getLookups().then((data) => {
      if (!active) return;
      setIncidentStatuses(data.incidentStatuses);
    }).catch(() => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedStatusId = incidentStatuses.find((status) => status.slug === filterStatus)?.id ?? "";

  const reportRows = useMemo(() => reportIncidents.map((incident) => ({
    id: incident.id,
    ticketNumber: incident.ticket_number,
    title: incident.title,
    category: incident.category?.name ?? "—",
    severity: incident.severity,
    statusSlug: incident.status?.slug ?? "unknown",
    statusLabel: incident.status?.name ?? statusLabel(incident.status?.slug ?? "unknown"),
    reportedAt: incident.reported_at ? new Date(incident.reported_at).toLocaleString() : "—",
    assignedTo: incident.current_assignee?.name ?? "—",
    resolvedAt: incident.resolved_at,
    reportedAtIso: incident.reported_at,
  })), [reportIncidents]);

  const handleExport = (format: string) => {
    if (reportRows.length === 0) return;
    setExporting(format);

    if (format === "CSV") {
      const headers = ["ID", "Ticket Number", "Title", "Category", "Severity", "Status", "Reported At", "Assigned To"];
      const rows = reportRows.map(r => [r.id, r.ticketNumber, r.title, r.category, r.severity, r.statusLabel, r.reportedAt, r.assignedTo]);
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `incident-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === "PDF") {
      const reportTitle = REPORT_TYPES.find(r => r.id === reportType)?.label ?? "Incident Report";
      const rowsHtml = reportRows.map(r => `
        <tr>
          <td>${r.ticketNumber}</td>
          <td>${r.title}</td>
          <td>${r.category}</td>
          <td>${r.severity.toUpperCase()}</td>
          <td>${r.statusLabel}</td>
          <td>${r.reportedAt}</td>
          <td>${r.assignedTo}</td>
        </tr>`).join("");
      const html = `
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #241f1b; }
              h1 { font-size: 20px; margin-bottom: 4px; }
              p.meta { color: #7a746c; font-size: 12px; margin-top: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              th { background: #f6f3ef; text-transform: uppercase; font-size: 10px; }
            </style>
          </head>
          <body>
            <h1>${reportTitle}</h1>
            <p class="meta">Period: ${dateFrom || "All time"} to ${dateTo || "Present"} · Generated ${new Date().toLocaleString()} · ${reportRows.length} records</p>
            <table>
              <thead><tr><th>Ticket</th><th>Title</th><th>Category</th><th>Severity</th><th>Status</th><th>Reported</th><th>Assigned To</th></tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </body>
        </html>`;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
      }
    }

    setTimeout(() => setExporting(null), 1000);
  };

  const resolved = reportRows.filter((t) => t.statusSlug === "resolved" || t.statusSlug === "closed");
  const avgResolution = useMemo(() => {
    const durations = reportIncidents
      .filter((t) => t.resolved_at && t.reported_at)
      .map((t) => new Date(t.resolved_at!).getTime() - new Date(t.reported_at).getTime());

    if (!durations.length) {
      return "—";
    }

    const avgMs = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    const hours = Math.round(avgMs / (1000 * 60 * 60));
    return `${hours}h`;
  }, [reportIncidents]);

  const avgResponse = "—";

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listIncidents({
        page: 1,
        per_page: 100,
        severity: filterSeverity === "all" ? "" : filterSeverity,
        status_id: filterStatus === "all" ? "" : selectedStatusId,
      });

      const incidents = response.data.filter((incident) => {
        if (dateFrom && new Date(incident.reported_at) < new Date(dateFrom)) {
          return false;
        }

        if (dateTo && new Date(incident.reported_at) > new Date(dateTo)) {
          return false;
        }

        return true;
      });

      setReportIncidents(incidents);
      setGenerated(true);
    } catch (err: unknown) {
      console.error("Failed to generate report:", err);
      setError("Unable to generate report. Please try again.");
      setReportIncidents([]);
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Generate and export comprehensive security incident reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report builder - moved to the right as a secondary control panel */}
        <div className="lg:order-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
            <BarChart2 className="h-4 w-4" style={{ color: "#b25b28" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Report Builder</h2>
          </div>
          <div className="p-5 space-y-5">
            {/* Report type */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#a89e92" }}>Report Type</p>
              <div className="space-y-2">
                {REPORT_TYPES.map(r => {
                  const Icon = r.icon;
                  return (
                    <button key={r.id} onClick={() => setReportType(r.id)}
                      className="w-full p-3 rounded-xl text-left transition-all"
                      style={{
                        border: `1px solid ${reportType === r.id ? r.color + "40" : BORDER}`,
                        background: reportType === r.id ? `${r.color}10` : "rgba(36,31,27,0.015)"
                      }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="h-4 w-4" style={{ color: r.color }} />
                        <span className="text-sm font-semibold" style={{ color: reportType === r.id ? r.color : "#4a453e" }}>{r.label}</span>
                      </div>
                      <p className="text-xs pl-6" style={{ color: "#9b9186" }}>{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#a89e92" }}>Date Range</p>
              <div className="space-y-2">
                {[{ label: "From", value: dateFrom, set: setDateFrom }, { label: "To", value: dateTo, set: setDateTo }].map(d => (
                  <div key={d.label}>
                    <label className="text-xs mb-1 block" style={{ color: "#9b9186" }}>{d.label}</label>
                    <input type="date" value={d.value} onChange={e => d.set(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#a89e92" }}>Filters</p>
              {[
                { label: "Severity", value: filterSeverity, set: setFilterSeverity, opts: [["all", "All Severities"], ["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]] },
                { label: "Status", value: filterStatus, set: setFilterStatus, opts: [["all", "All Statuses"], ["open", "Open"], ["assigned", "Assigned"], ["in_progress", "In Progress"], ["resolved", "Resolved"], ["closed", "Closed"]] },
              ].map(f => (
                <div key={f.label} className="mb-2">
                  <label className="text-xs mb-1 block" style={{ color: "#9b9186" }}>{f.label}</label>
                  <div className="relative">
                    <select value={f.value} onChange={e => f.set(e.target.value as SeverityLevel | "all")}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
                      style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
                      {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleGenerateReport}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              disabled={loading}
              style={{
                background: loading ? "rgba(178,91,40,0.6)" : "#b25b28",
                opacity: loading ? 0.75 : 1,
              }}>
              {loading ? "Generating report..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Report preview - now the primary, most prominent element */}
        <div className="lg:order-1 lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "#b25b28" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Report Preview</h2>
              {generated && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">Generated</span>
              )}
            </div>
            {generated && (
              <div className="flex gap-2">
                {["PDF", "CSV"].map(fmt => (
                  <button key={fmt} onClick={() => handleExport(fmt)} disabled={reportRows.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: exporting === fmt ? "rgba(21,128,61,0.1)" : "rgba(36,31,27,0.04)",
                      border: `1px solid ${exporting === fmt ? "rgba(21,128,61,0.25)" : BORDER}`,
                      color: exporting === fmt ? "#15803d" : "#7a746c"
                    }}>
                    <Download className="h-3 w-3" />
                    {exporting === fmt ? "Exporting..." : `Export ${fmt}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {generated ? (
            <div className="p-5 space-y-5">
              {/* Report header */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(178,91,40,0.05)", border: "1px solid rgba(178,91,40,0.15)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold" style={{ color: "#241f1b" }}>{REPORT_TYPES.find(r => r.id === reportType)?.label}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#9b9186" }}>Period: {dateFrom} to {dateTo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "#a89e92" }}>Generated</p>
                    <p className="text-xs" style={{ color: "#4a453e" }}>2024-06-22 14:30</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Incidents", value: reportRows.length, color: "#b25b28" },
                    { label: "Resolved", value: resolved.length, color: "#15803d" },
                    { label: "Avg Response", value: avgResponse, color: "#c2871f" },
                    { label: "Avg Resolution", value: avgResolution, color: "#3f6b7a" },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.6)" }}>
                      <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs" style={{ color: "#a89e92" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm rounded-xl" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
                  {error}
                </div>
              )}

              {/* Ticket table */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#4a453e" }}>Incident List ({reportRows.length} records)</h3>
                <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
                        {["ID", "Title", "Category", "Severity", "Status", "Date", "Assigned To"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#a89e92" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-10 text-center text-sm" style={{ color: "#a89e92" }}>No report data available.</td>
                        </tr>
                      ) : reportRows.map((t, i) => (
                        <tr key={t.id} className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                          style={{ borderBottom: i < reportRows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <td className="px-3 py-2.5 font-mono" style={{ color: "#94481d" }}>{t.id}</td>
                          <td className="px-3 py-2.5 max-w-[160px] truncate" style={{ color: "#4a453e" }}>{t.title}</td>
                          <td className="px-3 py-2.5" style={{ color: "#9b9186" }}>{t.category}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${severityColor(t.severity)}`}>{t.severity.toUpperCase()}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${statusColor(t.statusSlug)}`}>{t.statusLabel}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "#9b9186" }}>{t.reportedAt.split(" ")[0]}</td>
                          <td className="px-3 py-2.5" style={{ color: "#9b9186" }}>{t.assignedTo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 mb-3" style={{ color: "#c9c2b8" }} />
              <p className="text-sm" style={{ color: "#9b9186" }}>Configure your report settings and click Generate Report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

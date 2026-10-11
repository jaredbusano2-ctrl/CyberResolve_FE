import { useState, useEffect } from "react";
import { ClipboardList, Search, Eye, UserPlus, AlertTriangle, ChevronDown, X, Loader2, Plus } from "lucide-react";
import { useCyberResolve } from "../contexts/CyberResolveContext";
import { listIncidents, assignIncident, updateIncident } from "../services/incidentService";
import { listUsers } from "../services/userService";
import type { Incident, SeverityLevel } from "../interfaces/incident";
import type { User } from "../interfaces/user";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

// Helper functions for UI styling
const severityColor = (severity: SeverityLevel) => {
  switch(severity) {
    case "critical": return "bg-red-50 text-red-700 border-red-200";
    case "high": return "bg-blue-50 text-blue-700 border-blue-200";
    case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
    case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default: return "bg-stone-100 text-stone-600 border-stone-200";
  }
};

const statusColor = (slug: string) => {
  switch(slug) {
    case "open": return "bg-orange-50 text-orange-700 border-orange-200";
    case "assigned": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "in_progress": return "bg-purple-50 text-purple-700 border-purple-200";
    case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
    case "resolved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "closed": return "bg-stone-100 text-stone-600 border-stone-200";
    default: return "bg-stone-100 text-stone-600 border-stone-200";
  }
};

const statusLabel = (slug: string) => {
  switch(slug) {
    case "open": return "Open";
    case "assigned": return "Assigned";
    case "in_progress": return "In Progress";
    case "pending": return "Pending";
    case "resolved": return "Resolved";
    case "closed": return "Closed";
    default: return slug;
  }
};

export default function TicketManagement() {
  const { navigate } = useCyberResolve();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [assignModal, setAssignModal] = useState<Incident | null>(null);
  const [priorityModal, setPriorityModal] = useState<Incident | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<number | null>(null);
  const [newPriority, setNewPriority] = useState<SeverityLevel | "">("");
  const [assignNote, setAssignNote] = useState("");

  // Fetch incidents and analysts on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch incidents
        const incidentsResponse = await listIncidents({ page: 1 });
        setIncidents(incidentsResponse.data);
        
        // Extract unique categories and statuses
        const uniqueCategories = [...new Set(incidentsResponse.data.map(i => i.category?.name).filter(Boolean))] as string[];
        const uniqueStatuses = [...new Set(incidentsResponse.data.map(i => i.status?.slug).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
        setStatuses(uniqueStatuses);
        
        // Fetch all active users to filter analysts
        const usersResponse = await listUsers({ status: 'active' });
        // Filter users with "Security Analyst" role
        const analystUsers = usersResponse.data.filter(u => 
          u.roles.some(r => r.slug === "security-analyst")
        );
        setAnalysts(analystUsers);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = (
      i.ticket_number.toLowerCase().includes(q) || 
      i.title.toLowerCase().includes(q) || 
      (i.category?.name ?? "").toLowerCase().includes(q) ||
      (i.current_assignee?.name ?? "").toLowerCase().includes(q)
    );
    const matchStatus = filterStatus === "all" || i.status?.slug === filterStatus;
    const matchSeverity = filterSeverity === "all" || i.severity === filterSeverity;
    const matchCategory = filterCategory === "all" || i.category?.name === filterCategory;
    
    return matchSearch && matchStatus && matchSeverity && matchCategory;
  });

  const doAssign = async () => {
    if (!assignModal || !selectedAnalyst) return;
    
    try {
      setAssignLoading(true);
      setError(null);
      
      // Call the assignment API
      await assignIncident(assignModal.id, selectedAnalyst, assignNote || "Assigned by Administrator");
      
      // Refresh incidents list
      const incidentsResponse = await listIncidents({ page: 1 });
      setIncidents(incidentsResponse.data);
      
      setSuccessMessage(`Ticket ${assignModal.ticket_number} assigned successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setAssignModal(null);
      setSelectedAnalyst(null);
      setAssignNote("");
      setAssignLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign ticket");
      setAssignLoading(false);
    }
  };

  const doChangePriority = async () => {
    if (!priorityModal || !newPriority) return;
    
    try {
      setPriorityLoading(true);
      setError(null);
      
      // Call the update incident API to change severity
      await updateIncident(priorityModal.id, { severity: newPriority });
      
      // Refresh incidents list
      const incidentsResponse = await listIncidents({ page: 1 });
      setIncidents(incidentsResponse.data);
      
      setSuccessMessage(`Priority updated for ticket ${priorityModal.ticket_number}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setPriorityModal(null);
      setNewPriority("");
      setPriorityLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update priority");
      setPriorityLoading(false);
    }
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status?.slug === "open").length,
    unassigned: incidents.filter(i => !i.current_assignee_id).length,
    critical: incidents.filter(i => i.severity === "critical").length,
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: "#3f6b7a" }} />
          <p className="text-sm" style={{ color: "#9b9186" }}>Loading ticket data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.2)" }}>
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#15803d" }}></div>
          <p className="text-sm" style={{ color: "#15803d" }}>{successMessage}</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)" }}>
          <AlertTriangle className="h-4 w-4" style={{ color: "#b91c1c" }} />
          <p className="text-sm" style={{ color: "#b91c1c" }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" style={{ color: "#b91c1c" }} /></button>
        </div>
      )}
      
      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,31,27,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: `1px solid ${BORDER}`, boxShadow: "0 20px 48px rgba(60,45,30,0.16)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" style={{ color: "#3f6b7a" }} />
                <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Assign Security Analyst</h2>
              </div>
              <button onClick={() => { setAssignModal(null); setSelectedAnalyst(null); setAssignNote(""); }} disabled={assignLoading}>
                <X className="h-4 w-4" style={{ color: "#9b9186" }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(178,91,40,0.05)", border: "1px solid rgba(178,91,40,0.15)" }}>
                <p className="text-xs font-mono" style={{ color: "#94481d" }}>{assignModal.ticket_number}</p>
                <p className="text-sm mt-0.5" style={{ color: "#241f1b" }}>{assignModal.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Select Security Analyst</label>
                <div className="relative">
                  <select 
                    value={selectedAnalyst ?? ""} 
                    onChange={e => setSelectedAnalyst(Number(e.target.value))}
                    disabled={assignLoading}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none appearance-none disabled:opacity-50"
                    style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }}>
                    <option value="">Choose an analyst...</option>
                    {analysts.length === 0 ? (
                      <option value="" disabled>No analysts available</option>
                    ) : (
                      analysts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#9b9186" }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Assignment Note (Optional)</label>
                <textarea 
                  value={assignNote}
                  onChange={e => setAssignNote(e.target.value)}
                  disabled={assignLoading}
                  placeholder="Add notes about this assignment..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none disabled:opacity-50 resize-none"
                  style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setAssignModal(null); setSelectedAnalyst(null); setAssignNote(""); }} 
                  disabled={assignLoading}
                  className="flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
                  style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#7a746c" }}>
                  Cancel
                </button>
                <button 
                  onClick={doAssign} 
                  disabled={!selectedAnalyst || assignLoading} 
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#3f6b7a" }}>
                  {assignLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority modal */}
      {priorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,31,27,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: `1px solid ${BORDER}`, boxShadow: "0 20px 48px rgba(60,45,30,0.16)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" style={{ color: "#c2871f" }} />
                <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Change Priority</h2>
              </div>
              <button onClick={() => { setPriorityModal(null); setNewPriority(""); }} disabled={priorityLoading}>
                <X className="h-4 w-4" style={{ color: "#9b9186" }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs" style={{ color: "#9b9186" }}>
                Current: <span className="font-semibold" style={{
                  color: priorityModal.severity === "critical" ? "#dc4444" : 
                  priorityModal.severity === "high" ? "#2563eb" : 
                  priorityModal.severity === "medium" ? "#c2871f" : 
                  "#2f9e6e"
                }}>
                  {priorityModal.severity.toUpperCase()}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["low","medium","high","critical"] as SeverityLevel[]).map(s => {
                  const c = s === "critical" ? "#dc4444" : s === "high" ? "#2563eb" : s === "medium" ? "#c2871f" : "#2f9e6e";
                  return (
                    <button 
                      key={s} 
                      onClick={() => setNewPriority(s)}
                      disabled={priorityLoading}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                      style={{
                        border: `2px solid ${newPriority === s ? c : BORDER}`,
                        background: newPriority === s ? `${c}18` : "transparent",
                        color: newPriority === s ? c : "#9b9186"
                      }}>
                      {s.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setPriorityModal(null); setNewPriority(""); }} 
                  disabled={priorityLoading}
                  className="flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
                  style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#7a746c" }}>
                  Cancel
                </button>
                <button 
                  onClick={doChangePriority} 
                  disabled={!newPriority || priorityLoading} 
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#c2871f" }}>
                  {priorityLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Ticket Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Manage, assign, and prioritize all incident tickets</p>
        </div>
        <button onClick={() => navigate("report-incident")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#b25b28", boxShadow: "0 4px 16px rgba(178,91,40,0.28)" }}>
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Combined stats + filters toolbar */}
      <div className="rounded-xl p-4 flex flex-col xl:flex-row xl:items-center gap-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-5 xl:pr-5 xl:border-r" style={{ borderColor: BORDER }}>
          {[
            { label: "Total", value: stats.total, color: "#b25b28" },
            { label: "Open", value: stats.open, color: "#c2871f" },
            { label: "Unassigned", value: stats.unassigned, color: "#dc4444" },
            { label: "Critical", value: stats.critical, color: "#b91c1c" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9b9186" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9b9186" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
              <option value="all">All Status</option>
              {statuses.map(s => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
          </div>
          <div className="relative">
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
          </div>
          <div className="relative">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
          <ClipboardList className="h-4 w-4" style={{ color: "#b25b28" }} />
          <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>All Incidents</h2>
          <span className="ml-auto text-xs" style={{ color: "#a89e92" }}>{filtered.length} of {incidents.length} tickets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["ID","Title","Category","Severity","Status","Assigned To","Date","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#a89e92" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: "#a89e92" }}>
                    {incidents.length === 0 ? "No incidents available." : "No incidents match your filters."}
                  </td>
                </tr>
              ) : filtered.map((incident, i) => {
                const isUnassigned = !incident.current_assignee_id;
                const canAssign = incident.status?.slug === "open" || isUnassigned;
                
                return (
                  <tr key={incident.id} className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "#94481d" }}>{incident.ticket_number}</td>
                    <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: "#4a453e" }}>{incident.title}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>{incident.category?.name ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(incident.status?.slug ?? "")}`}>
                        {statusLabel(incident.status?.slug ?? "")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>
                      {incident.current_assignee?.name ?? <span style={{ color: "#dc4444" }}>Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>
                      {new Date(incident.reported_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => navigate("ticket-details", incident.id.toString())}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(178,91,40,0.1)]" 
                          style={{ color: "#9b9186" }}
                          title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canAssign && (
                          <button 
                            onClick={() => setAssignModal(incident)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(63,107,122,0.1)]" 
                            style={{ color: "#9b9186" }}
                            title="Assign Analyst">
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => { setPriorityModal(incident); setNewPriority(incident.severity); }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(194,135,31,0.1)]" 
                          style={{ color: "#9b9186" }}
                          title="Change Priority">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

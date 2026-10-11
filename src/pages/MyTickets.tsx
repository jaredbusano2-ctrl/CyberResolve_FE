import { useEffect, useState } from "react";
import { Ticket, Search, ChevronDown, Eye, Plus } from "lucide-react";
import { useCyberResolve, severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

export default function MyTickets() {
  const { navigate } = useCyberResolve();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [tickets, setTickets] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await listIncidents({ mine: true });
        if (!active) {
          return;
        }

        setTickets(response.data || []);
      } catch (err: any) {
        if (!active) {
          return;
        }

        setTickets([]);
        setError(err?.response?.data?.message || "Failed to load your incidents");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const statusSlug = ticket.status?.slug ?? "";
    const matchSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.category?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || statusSlug === filterStatus;
    const matchSeverity = filterSeverity === "all" || ticket.severity === filterSeverity;
    return matchSearch && matchStatus && matchSeverity;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="rounded-xl p-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <p className="text-sm" style={{ color: "#9b9186" }}>Loading your incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>My Tickets</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>{filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found</p>
        </div>
        <button onClick={() => navigate("report-incident")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#b25b28", boxShadow: "0 4px 16px rgba(178,91,40,0.28)" }}>
          <Plus className="h-4 w-4" />
          New Incident
        </button>
      </div>

      <div className="rounded-xl p-4 flex flex-col sm:flex-row gap-3" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9b9186" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, or category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
        </div>
        <div className="flex gap-2">
          {[
            { label: "Status", value: filterStatus, set: setFilterStatus, options: ["all", "new", "investigating", "contained", "eradicated", "recovering", "closed"] },
            { label: "Severity", value: filterSeverity, set: setFilterSeverity, options: ["all", "critical", "high", "medium", "low"] },
          ].map((filter) => (
            <div key={filter.label} className="relative">
              <select value={filter.value} onChange={(e) => filter.set(e.target.value)}
                className="pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
                {filter.options.map((option) => (
                  <option key={option} value={option}>{option === "all" ? `All ${filter.label}s` : statusLabel(option)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
          <Ticket className="h-4 w-4" style={{ color: "#b25b28" }} />
          <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Incident Tickets</h2>
          <span className="ml-auto px-2 py-0.5 rounded-md text-xs font-semibold border" style={{ background: "rgba(178,91,40,0.08)", color: "#94481d", borderColor: "rgba(178,91,40,0.2)" }}>
            {filteredTickets.length} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Ticket ID", "Title", "Category", "Severity", "Status", "Date Submitted", "Actions"].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#a89e92" }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#a89e92" }}>No tickets match your search</td>
                </tr>
              ) : (
                filteredTickets.map((ticket, index) => {
                  const statusSlug = ticket.status?.slug ?? "";

                  return (
                    <tr key={ticket.id} className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                      style={{ borderBottom: index < filteredTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td className="px-5 py-4 font-mono text-xs whitespace-nowrap" style={{ color: "#94481d" }}>{ticket.ticket_number}</td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-xs font-medium max-w-[200px] truncate" style={{ color: "#241f1b" }}>{ticket.title}</p>
                          <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "#9b9186" }}>{ticket.description.substring(0, 50)}…</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>{ticket.category?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${severityColor(ticket.severity)}`}>
                          {ticket.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor(statusSlug)}`}>
                          {statusLabel(statusSlug)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>{new Date(ticket.reported_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => navigate("ticket-details", ticket.id.toString())}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: "rgba(178,91,40,0.08)", border: "1px solid rgba(178,91,40,0.2)", color: "#94481d" }}>
                          <Eye className="h-3 w-3" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

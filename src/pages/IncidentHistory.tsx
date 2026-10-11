import { useEffect, useState } from "react";
import { Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useCyberResolve, severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import { listIncidents } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

export default function IncidentHistory() {
  const { currentUser, navigate } = useCyberResolve();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  // Load incidents from API (assigned to current user) and show resolved/closed
  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!currentUser) return;

      setLoading(true);

      try {
        const resp = await listIncidents({ per_page: 200, assigned_to_me: true });
        if (!active) return;

        // resp.data is the array in PaginatedResponse
        setIncidents(resp.data || []);
      } catch (err: any) {
        if (!active) return;
        console.error("Failed to load incidents:", err);
        setIncidents([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [currentUser]);

  // Get all historical incidents (resolved or closed) assigned to current user
  const historicalIncidents = incidents.filter((i) => {
    const slug = i.status?.slug ?? "";
    return slug === "resolved" || slug === "closed" || Boolean(i.status?.is_closed);
  });

  // No extra filters: show all historical incidents
  const filteredIncidents = historicalIncidents;

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Stats removed — table only view with pagination

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Incident History</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>
          Historical record of resolved and failed incidents
        </p>
      </div>

      {/* Table-only view: no stats or filters */}

      {/* History Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {[
                  "Ticket ID",
                  "Incident Title",
                  "Category",
                  "Severity",
                  "Status",
                  "Submitted",
                  "Resolved",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#a89e92" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <p className="text-sm" style={{ color: "#9b9186" }}>Loading historical incidents...</p>
                    </td>
                  </tr>
                ) : paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-10 w-10" style={{ color: "#c9c2b8" }} />
                      <p className="text-sm" style={{ color: "#9b9186" }}>No historical incidents found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((incident: any, i: number) => {
                  return (
                    <tr
                      key={incident.id}
                      className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                      style={{
                        borderBottom: i < paginatedIncidents.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "#94481d" }}>{incident.ticket_number ?? incident.id}</td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: "#241f1b" }}>
                        {incident.title}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9b9186" }}>{incident.category?.name ?? "Uncategorized"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(
                            incident.severity
                          )}`}
                        >
                          {incident.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(
                            incident.status?.slug ?? ""
                          )}`}
                        >
                          {statusLabel(incident.status?.slug ?? "")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9b9186" }}>{incident.reported_at ? new Date(incident.reported_at).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9b9186" }}>{(incident.resolved_at || incident.closed_at || incident.updated_at) ? new Date(incident.resolved_at || incident.closed_at || incident.updated_at).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate("investigation", String(incident.id))}
                          className="flex items-center gap-1 text-xs font-semibold"
                          style={{ color: "#3f6b7a" }}
                        >
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

        {/* Pagination */}
        {filteredIncidents.length > itemsPerPage && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#9b9186" }}>
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of{" "}
              {filteredIncidents.length} incidents
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: "#9b9186" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm" style={{ color: "#4a453e" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: "#9b9186" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

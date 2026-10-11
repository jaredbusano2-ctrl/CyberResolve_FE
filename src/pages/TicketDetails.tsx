import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Calendar, User, Paperclip, Clock, CheckCircle2, Tag, ShieldAlert, FileText, MessageSquare } from "lucide-react";
import { useCyberResolve, severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import { getIncident } from "../services/incidentService";
import type { Incident } from "../interfaces/incident";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const LIFECYCLE = ["new", "investigating", "contained", "eradicated", "recovering", "closed"] as const;
const LIFECYCLE_LABELS: Record<string, string> = {
  new: "New",
  investigating: "Investigating",
  contained: "Contained",
  eradicated: "Eradicated",
  recovering: "Recovering",
  closed: "Closed",
};

export default function TicketDetails() {
  const { selectedTicketId, navigate } = useCyberResolve();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadIncident = async () => {
      setLoading(true);
      setError(null);

      if (!selectedTicketId) {
        setIncident(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getIncident(Number(selectedTicketId));
        if (!active) {
          return;
        }

        setIncident(response.incident || null);
      } catch (err: any) {
        if (!active) {
          return;
        }

        setIncident(null);
        setError(err?.response?.data?.message || "Failed to load incident details");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadIncident();

    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  const ticket = useMemo(() => {
    if (!incident) {
      return null;
    }

    const updates = (incident.history ?? []).map((entry) => ({
      id: String(entry.id),
      author: entry.user?.name ?? "System",
      role: entry.user?.roles?.[0]?.name ?? "Security Analyst",
      timestamp: new Date(entry.created_at).toLocaleString(),
      message: entry.description,
      type:
        entry.event_type === "assigned"
          ? "assignment"
          : entry.event_type === "status_changed"
            ? "status"
            : entry.event_type === "resolved"
              ? "resolution"
              : "note",
    }));

    return {
      id: incident.ticket_number,
      title: incident.title,
      category: incident.category?.name ?? "Uncategorized",
      severity: incident.severity,
      status: incident.status?.slug ?? "new",
      description: incident.description,
      submittedBy: incident.reporter?.name ?? "Unknown",
      assignedTo: incident.current_assignee?.name ?? "",
      dateSubmitted: new Date(incident.reported_at).toLocaleString(),
      lastUpdated: new Date(incident.updated_at ?? incident.reported_at).toLocaleString(),
      location: incident.location ?? "Unknown",
      attachments: incident.attachments?.length ?? 0,
      updates,
    };
  }, [incident]);

  const statusIdx = ticket ? LIFECYCLE.indexOf(ticket.status as any) : -1;

  const typeIcon = (type: string) => {
    if (type === "status") return <Clock className="h-3 w-3" style={{ color: "#b25b28" }} />;
    if (type === "assignment") return <User className="h-3 w-3" style={{ color: "#3f6b7a" }} />;
    if (type === "resolution") return <CheckCircle2 className="h-3 w-3" style={{ color: "#15803d" }} />;
    return <MessageSquare className="h-3 w-3" style={{ color: "#7c3aed" }} />;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <p className="font-semibold" style={{ color: "#4a453e" }}>Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <button onClick={() => navigate("my-tickets")}
          className="flex items-center gap-2 transition-colors text-sm" style={{ color: "#9b9186" }}>
          <ArrowLeft className="h-4 w-4" /> Back to My Tickets
        </button>
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <p className="font-semibold" style={{ color: "#4a453e" }}>Unable to load incident.</p>
          <p className="text-sm mt-1" style={{ color: "#9b9186" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <button onClick={() => navigate("my-tickets")}
          className="flex items-center gap-2 transition-colors text-sm" style={{ color: "#9b9186" }}>
          <ArrowLeft className="h-4 w-4" /> Back to My Tickets
        </button>
        <div className="rounded-xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <p className="font-semibold" style={{ color: "#4a453e" }}>No ticket selected.</p>
          <p className="text-sm mt-1" style={{ color: "#9b9186" }}>Create or select an incident to view its details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate("my-tickets")}
        className="flex items-center gap-2 transition-colors text-sm" style={{ color: "#9b9186" }}>
        <ArrowLeft className="h-4 w-4" /> Back to My Tickets
      </button>

      <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-sm" style={{ color: "#94481d" }}>{ticket.id}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${severityColor(ticket.severity)}`}>
                {ticket.severity.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor(ticket.status)}`}>
                {statusLabel(ticket.status)}
              </span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#241f1b" }}>{ticket.title}</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs" style={{ color: "#9b9186" }}>Last updated</p>
            <p className="text-sm" style={{ color: "#4a453e" }}>{ticket.lastUpdated}</p>
          </div>
        </div>

        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#a89e92" }}>Ticket Lifecycle</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {LIFECYCLE.map((s, i) => {
              const done = i <= statusIdx;
              const current = i === statusIdx;
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: current ? "#b25b28" : done ? "rgba(178,91,40,0.16)" : "rgba(36,31,27,0.04)",
                        border: current ? "2px solid #b25b28" : done ? "2px solid rgba(178,91,40,0.35)" : "2px solid rgba(36,31,27,0.1)",
                        color: current ? "#ffffff" : done ? "#94481d" : "#a89e92",
                        boxShadow: current ? "0 0 12px rgba(178,91,40,0.3)" : "none"
                      }}>
                      {done && !current ? "✓" : i + 1}
                    </div>
                    <span className="text-xs whitespace-nowrap" style={{ color: current ? "#94481d" : done ? "#7a746c" : "#c9c2b8" }}>
                      {LIFECYCLE_LABELS[s]}
                    </span>
                  </div>
                  {i < LIFECYCLE.length - 1 && (
                    <div className="w-8 h-0.5 mb-4 mx-0.5 rounded"
                      style={{ background: i < statusIdx ? "rgba(178,91,40,0.35)" : "rgba(36,31,27,0.08)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#241f1b" }}>
              <ShieldAlert className="h-4 w-4" style={{ color: "#b25b28" }} /> Incident Information
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { icon: Tag, label: "Category", value: ticket.category },
                { icon: MapPin, label: "Location", value: ticket.location },
                { icon: Calendar, label: "Reported", value: ticket.dateSubmitted },
                { icon: User, label: "Reported By", value: ticket.submittedBy },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3 w-3" style={{ color: "#9b9186" }} />
                    <p className="text-xs" style={{ color: "#9b9186" }}>{label}</p>
                  </div>
                  <p className="text-sm" style={{ color: "#4a453e" }}>{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "#9b9186" }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: "#4a453e" }}>{ticket.description}</p>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#241f1b" }}>
              <Clock className="h-4 w-4" style={{ color: "#b25b28" }} /> Ticket Timeline & Investigation Updates
            </h2>

            <div className="relative pl-8 pb-5" style={{ borderLeft: "1px solid rgba(36,31,27,0.14)" }}>
              <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2" style={{ background: "#b25b28", borderColor: "#ffffff" }} />
              <p className="text-xs mb-1 font-mono" style={{ color: "#a89e92" }}>{ticket.dateSubmitted}</p>
              <div className="p-3 rounded-lg" style={{ background: "rgba(178,91,40,0.05)", border: "1px solid rgba(178,91,40,0.15)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3 w-3" style={{ color: "#94481d" }} />
                  <span className="text-xs font-semibold" style={{ color: "#94481d" }}>{ticket.submittedBy}</span>
                  <span className="text-xs" style={{ color: "#c9c2b8" }}>· Employee</span>
                </div>
                <p className="text-xs" style={{ color: "#4a453e" }}>Incident reported and ticket created.</p>
              </div>
            </div>

            {ticket.updates.map((u, i) => (
              <div key={u.id} className="relative pl-8 pb-5" style={{ borderLeft: i < ticket.updates.length - 1 ? "1px solid rgba(36,31,27,0.14)" : "none" }}>
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2"
                  style={{
                    background: u.type === "resolution" ? "#15803d" : u.type === "assignment" ? "#3f6b7a" : "#b25b28",
                    borderColor: "#ffffff"
                  }} />
                <p className="text-xs mb-1 font-mono" style={{ color: "#a89e92" }}>{u.timestamp}</p>
                <div className="p-3 rounded-lg" style={{
                  background: u.type === "resolution" ? "rgba(21,128,61,0.05)" : "rgba(36,31,27,0.02)",
                  border: `1px solid ${u.type === "resolution" ? "rgba(21,128,61,0.18)" : BORDER}`
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcon(u.type)}
                    <span className="text-xs font-semibold" style={{ color: u.type === "resolution" ? "#15803d" : u.type === "assignment" ? "#3f6b7a" : "#94481d" }}>
                      {u.author}
                    </span>
                    <span className="text-xs" style={{ color: "#c9c2b8" }}>· {u.role}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded capitalize" style={{
                      background: u.type === "resolution" ? "rgba(21,128,61,0.1)" : "rgba(36,31,27,0.05)",
                      color: u.type === "resolution" ? "#15803d" : "#7a746c"
                    }}>{u.type}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#4a453e" }}>{u.message}</p>
                </div>
              </div>
            ))}

            {ticket.updates.length === 0 && (
              <div className="text-center py-6 text-sm" style={{ color: "#9b9186" }}>
                No investigation updates yet. Awaiting analyst assignment.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#241f1b" }}>
              <User className="h-4 w-4" style={{ color: "#3f6b7a" }} /> Assigned Analyst
            </h3>
            {ticket.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: "rgba(63,107,122,0.12)", border: "1px solid rgba(63,107,122,0.28)", color: "#2c5563" }}>
                  {ticket.assignedTo.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#241f1b" }}>{ticket.assignedTo}</p>
                  <p className="text-xs" style={{ color: "#3f6b7a" }}>Security Analyst · SOC</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2f9e6e" }} />
                    <span className="text-xs" style={{ color: "#15803d" }}>Online</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(36,31,27,0.05)" }}>
                  <User className="h-5 w-5" style={{ color: "#a89e92" }} />
                </div>
                <p className="text-xs" style={{ color: "#9b9186" }}>Pending assignment</p>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#241f1b" }}>
              <Paperclip className="h-4 w-4" style={{ color: "#b25b28" }} /> Attachments
              <span className="ml-auto text-xs" style={{ color: "#a89e92" }}>{ticket.attachments} file{ticket.attachments !== 1 ? "s" : ""}</span>
            </h3>
            {ticket.attachments > 0 ? (
              <div className="space-y-2">
                {Array.from({ length: ticket.attachments }, (_, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                    style={{ background: "rgba(36,31,27,0.02)", border: `1px solid ${BORDER}` }}>
                    <FileText className="h-3 w-3 shrink-0" style={{ color: "#b25b28" }} />
                    <span className="text-xs truncate" style={{ color: "#4a453e" }}>
                      {ticket.attachments > 0 ? `attachment_${i + 1}.file` : "attachment.file"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: "#9b9186" }}>No attachments</p>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "#241f1b" }}>Ticket Metadata</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Ticket ID", value: ticket.id },
                { label: "Category", value: ticket.category },
                { label: "Severity", value: ticket.severity.toUpperCase() },
                { label: "Submitted", value: ticket.dateSubmitted },
                { label: "Last Updated", value: ticket.lastUpdated },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid rgba(36,31,27,0.08)` }}>
                  <span style={{ color: "#9b9186" }}>{label}</span>
                  <span className="font-medium" style={{ color: "#4a453e" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

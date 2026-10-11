import { useEffect, useState } from "react";
import { Ticket, Plus, ChevronRight, Bell } from "lucide-react";
import { useCyberResolve, severityColor, statusColor, statusLabel } from "../contexts/CyberResolveContext";
import type { Incident, Notification } from "../interfaces";
import { listIncidents } from "../services/incidentService";
import { getNotifications } from "../services/notificationService";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function UserDashboard() {
  const { currentUser, navigate } = useCyberResolve();
  const [tickets, setTickets] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    Promise.all([listIncidents({ mine: true, page: 1 }), getNotifications()])
      .then(([incidentResponse, notificationResponse]) => {
        if (!active) return;
        setTickets(incidentResponse.data);
        setNotifications(notificationResponse.notifications.data);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load your recent tickets and notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recentTickets = tickets.slice(0, 4);
  const recentNotifications = notifications.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Welcome back, {currentUser?.name.split(" ")[0]}</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Report incidents, track progress, and review updates in one place.</p>
        </div>
        <button
          onClick={() => navigate("report-incident")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: "#b25b28", boxShadow: "0 4px 16px rgba(178,91,40,0.28)" }}
        >
          <Plus className="h-4 w-4" />
          Report Incident
        </button>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl p-4 text-sm" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#9b9186" }}>
          Loading your recent incidents and notifications...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4" style={{ color: "#b25b28" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Recent Ticket Status</h2>
            </div>
            <button onClick={() => navigate("my-tickets")} className="text-xs flex items-center gap-1" style={{ color: "#94481d" }}>
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Ticket ID", "Title", "Severity", "Status", "Submitted"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#a89e92" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!recentTickets.length ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: "#a89e92" }}>
                      No incident tickets submitted yet.
                    </td>
                  </tr>
                ) : recentTickets.map((t, i) => (
                  <tr key={t.id} className="transition-colors cursor-pointer hover:bg-[rgba(178,91,40,0.04)]" style={{ borderBottom: i < recentTickets.length - 1 ? `1px solid ${BORDER}` : "none" }}
                    onClick={() => navigate("ticket-details", String(t.id))}>
                    <td className="px-5 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "#94481d" }}>{t.ticket_number}</td>
                    <td className="px-5 py-3 max-w-[180px] truncate" style={{ color: "#4a453e" }}>{t.title}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${severityColor(t.severity)}`}>
                        {t.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor(t.status?.slug ?? "")}`}>
                        {statusLabel(t.status?.name ?? "Unknown")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>{formatDateTime(t.reported_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: "#b25b28" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Recent Notifications</h2>
            </div>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold border" style={{ background: "rgba(178,91,40,0.08)", color: "#94481d", borderColor: "rgba(178,91,40,0.2)" }}>
              {recentNotifications.length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {!recentNotifications.length ? (
              <div className="p-3 rounded-lg text-center text-xs" style={{ background: "rgba(36,31,27,0.02)", border: `1px solid ${BORDER}`, color: "#a89e92" }}>
                No notifications yet.
              </div>
            ) : recentNotifications.map(n => (
              <div key={n.id} className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                style={{ background: "rgba(36,31,27,0.02)", border: `1px solid ${BORDER}` }}>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{
                    background: n.type === "ticket.assigned" ? "#3f6b7a" : n.type === "incident.created" ? "#b25b28" : n.type === "incident.status_changed" ? "#c2871f" : "#7c3aed"
                  }} />
                  <div>
                    <p className="text-xs leading-relaxed" style={{ color: "#4a453e" }}>{n.title}</p>
                    <p className="text-xs mt-1" style={{ color: "#a89e92" }}>{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

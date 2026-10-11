import { useEffect, useState } from "react";
import { Bell, CheckCheck, Ticket, UserRound, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import type { Notification } from "../interfaces";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function notificationIcon(type: string) {
  if (type === "incident.created") return <Ticket className="h-4 w-4" style={{ color: "#b25b28" }} />;
  if (type === "incident.assigned") return <UserRound className="h-4 w-4" style={{ color: "#3f6b7a" }} />;
  if (type === "incident.resolved") return <CheckCircle2 className="h-4 w-4" style={{ color: "#15803d" }} />;
  if (type === "incident.closed") return <CheckCheck className="h-4 w-4" style={{ color: "#7a746c" }} />;
  if (type === "incident.status_changed") return <RefreshCw className="h-4 w-4" style={{ color: "#c2871f" }} />;
  return <AlertTriangle className="h-4 w-4" style={{ color: "#9b9186" }} />;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.notifications.data);
      setUnreadCount(response.unreadCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await refresh();
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    await refresh();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Ticket submitted, assigned, updated, resolved, and closed events.</p>
        </div>
        <button onClick={handleMarkAllRead}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#b25b28", boxShadow: "0 4px 16px rgba(178,91,40,0.28)" }}>
          Mark all read
        </button>
      </div>

      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: "#b25b28" }} />
          <p className="text-sm font-medium" style={{ color: "#241f1b" }}>Unread notifications</p>
        </div>
        <span className="px-2 py-0.5 rounded-md text-xs font-semibold border" style={{ background: "rgba(178,91,40,0.08)", color: "#94481d", borderColor: "rgba(178,91,40,0.2)" }}>
          {unreadCount}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        {loading ? (
          <div className="p-6 text-sm" style={{ color: "#9b9186" }}>Loading notifications...</div>
        ) : !notifications.length ? (
          <div className="p-6 text-sm" style={{ color: "#a89e92" }}>No notifications available yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => void handleMarkRead(notification.id)}
                className="w-full text-left px-5 py-4 transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                style={{ opacity: notification.read_at ? 0.65 : 1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{notificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium" style={{ color: "#241f1b" }}>{notification.title}</p>
                      <span className="text-xs whitespace-nowrap" style={{ color: "#a89e92" }}>{formatDateTime(notification.created_at)}</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: "#7a746c" }}>{notification.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

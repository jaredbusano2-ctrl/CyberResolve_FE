import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, BookOpen, ClipboardList, FileWarning, FileText, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, Ticket, User, UserCog, Users, BarChart2 } from "lucide-react";
import InfoSecLogo from "../../Logo/Logo.jpg";
import { useCyberResolve } from "../contexts/CyberResolveContext";

const BG = "#f6f3ef";
const SIDEBAR = "rgba(255,255,255,0.92)";
const BORDER = "rgba(36,31,27,0.09)";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV: NavItem[] = [
  { id: "user-dashboard", label: "Home", icon: LayoutDashboard, roles: ["user"] },
  { id: "report-incident", label: "Report Incident", icon: FileWarning, roles: ["user"] },
  { id: "my-tickets", label: "My Tickets", icon: Ticket, roles: ["user"] },
  { id: "notifications", label: "Notifications", icon: Bell, roles: ["user"] },
  { id: "profile", label: "Profile", icon: UserCog, roles: ["user"] },
  { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { id: "analyst-dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["analyst"] },
  { id: "assigned-tickets", label: "Assigned Tickets", icon: ClipboardList, roles: ["analyst"] },
  { id: "investigation", label: "Investigations", icon: Search, roles: ["analyst"] },
  { id: "incident-history", label: "Incident History", icon: BookOpen, roles: ["analyst"] },
  { id: "reports", label: "Reports", icon: FileText, roles: ["analyst"] },
  { id: "settings", label: "Settings", icon: Settings, roles: ["analyst"] },
  { id: "ticket-management", label: "Ticket Management", icon: ClipboardList, roles: ["admin"] },
  { id: "user-management", label: "User Management", icon: Users, roles: ["admin"] },
  { id: "audit-logs", label: "Audit Logs", icon: BookOpen, roles: ["admin"] },
  { id: "analytics", label: "Analytics", icon: BarChart2, roles: ["admin"] },
  { id: "admin-reports", label: "Reports", icon: FileText, roles: ["admin"] },
  { id: "admin-settings", label: "Settings", icon: Settings, roles: ["admin", "user"] },
];

export default function CyberResolveLayout({ children }: { children?: React.ReactNode }) {
  const { currentUser, currentPage, notifications, navigate, logout, justLoggedIn, clearJustLoggedIn } = useCyberResolve();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const role = currentUser?.role ?? "user";
  const visibleNav = NAV.filter(item => item.roles.includes(role));
  const roleColor = role === "admin" ? "#c2410c" : role === "analyst" ? "#3f6b7a" : "#b25b28";

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!justLoggedIn) return;
    const id = setTimeout(() => clearJustLoggedIn(), 2200);
    return () => clearTimeout(id);
  }, [justLoggedIn, clearJustLoggedIn]);

  const phDate = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const phTime = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#241f1b", fontFamily: "var(--font-body)" }}>
      <aside className="flex flex-col shrink-0 transition-all duration-300 relative z-20"
        style={{ width: collapsed ? "64px" : "240px", background: SIDEBAR, borderRight: `1px solid ${BORDER}` }}>
        <div className="shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                style={{ background: "#fdfaf7", border: "1px solid rgba(178,91,40,0.28)", boxShadow: "0 8px 22px rgba(178,91,40,0.14)" }}>
                <img src={InfoSecLogo} alt="CyberResolve" className="w-full h-full object-contain" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500" style={{ border: "2px solid #ffffff" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base leading-tight" style={{ color: "#241f1b" }}>CyberResolve</p>
                <p className="text-xs leading-tight text-body-secondary truncate">{currentUser?.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center px-2 py-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                style={{ background: "#fdfaf7", border: "1px solid rgba(178,91,40,0.28)", boxShadow: "0 6px 16px rgba(178,91,40,0.14)" }}>
                <img src={InfoSecLogo} alt="CyberResolve" className="w-full h-full object-contain" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" style={{ border: "2px solid #ffffff" }} />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative"
                style={{
                  background: active ? "rgba(178,91,40,0.1)" : "transparent",
                  border: active ? "1px solid rgba(178,91,40,0.22)" : "1px solid transparent",
                  color: active ? "#94481d" : "#5c564d",
                }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "#b25b28" : undefined }} />
                {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                {!collapsed && item.id === "notifications" && notifications > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{notifications}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-2">
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:brightness-95"
            style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.16)", color: "#b91c1c" }}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,31,27,0.35)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "#ffffff", boxShadow: "0 25px 60px rgba(60,45,30,0.18)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(185,28,28,0.07)", border: "1px solid rgba(185,28,28,0.22)" }}>
              <LogOut className="h-6 w-6" style={{ color: "#b91c1c" }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: "#241f1b" }}>Log out?</h3>
            <p className="text-sm mb-5" style={{ color: "#7a746c" }}>You'll need to sign in again to access your dashboard.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#7a746c" }}>Cancel</button>
              <button onClick={logout} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#b91c1c" }}>Log out</button>
            </div>
          </div>
        </div>
      )}

      {justLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,31,27,0.35)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "#ffffff", boxShadow: "0 25px 60px rgba(60,45,30,0.18)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(47,158,110,0.1)", border: "1px solid rgba(47,158,110,0.28)" }}>
              <ShieldCheck className="h-6 w-6" style={{ color: "#2f9e6e" }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: "#241f1b" }}>Welcome back{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}!</h3>
            <p className="text-sm" style={{ color: "#7a746c" }}>You've successfully signed in to CyberResolve.</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 flex items-center justify-between px-6 h-14"
          style={{ background: "rgba(255,255,255,0.9)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors hover:bg-[rgba(36,31,27,0.06)]"
              style={{ color: "#7a746c" }} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium capitalize hidden md:block" style={{ color: "#4a453e" }}>
              {visibleNav.find(item => item.id === currentPage)?.label ?? "Home"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg flex items-center gap-2 hidden sm:flex" style={{ background: "rgba(36,31,27,0.03)", border: `1px solid ${BORDER}` }}>
              <span className="text-xs font-mono" style={{ color: "#4a453e" }}>{phDate}</span>
              <span style={{ color: "#c9c2b8" }}>·</span>
              <span className="text-xs font-mono tabular-nums" style={{ color: "#94481d" }}>{phTime}</span>
            </div>
            <button
              onClick={() => navigate(role === "admin" ? "admin-settings" : role === "analyst" ? "settings" : "profile")}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full transition-colors hover:bg-[rgba(36,31,27,0.04)]"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#ffffff", border: `2px solid ${roleColor}`, color: roleColor }}>
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-sm font-semibold" style={{ color: "#241f1b" }}>{currentUser?.name.split(" ")[0]}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: BG }}>
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
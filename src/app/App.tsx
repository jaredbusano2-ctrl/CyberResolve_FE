import { CyberResolveProvider, useCyberResolve } from "../contexts/CyberResolveContext";
import CyberResolveLogin from "../pages/CyberResolveLogin";
import CyberResolveLayout from "../layouts/CyberResolveLayout";
import UserDashboard from "../pages/UserDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import AnalystDashboard from "../pages/AnalystDashboard";
import ReportIncident from "../pages/ReportIncident";
import MyTickets from "../pages/MyTickets.tsx";
import Notifications from "../pages/Notifications";
import TicketDetails from "../pages/TicketDetails.tsx";
import UserManagement from "../pages/UserManagement";
import TicketManagement from "../pages/TicketManagement";
import Investigation from "../pages/Investigation.tsx";
import AssignedTickets from "../pages/AssignedTickets.tsx";
import IncidentHistory from "../pages/IncidentHistory";
import AuditLogs from "../pages/AuditLogs";
import Reports from "../pages/Reports";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";

function PageRenderer() {
  const { currentPage, currentUser, initializing } = useCyberResolve();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f6f3ef" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(178,91,40,0.25)", borderTopColor: "#b25b28" }} />
          <p className="text-sm font-mono" style={{ color: "#9b9186" }}>Checking session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentPage === "login") return <CyberResolveLogin />;

  const pages: Record<string, React.ReactNode> = {
    "user-dashboard":    <UserDashboard />,
    "admin-dashboard":   <AdminDashboard />,
    "analyst-dashboard": <AnalystDashboard />,
    "report-incident":   <ReportIncident />,
    "my-tickets":        <MyTickets />,
    "notifications":     <Notifications />,
    "ticket-details":    <TicketDetails />,
    "user-management":   <UserManagement />,
    "ticket-management": <TicketManagement />,
    "investigation":     <Investigation />,
    "assigned-tickets":  <AssignedTickets />,
    "incident-history":  <IncidentHistory />,
    "audit-logs":        <AuditLogs />,
    "reports":           <Reports />,
    "admin-reports":     <Reports />,
    "analytics":         <Analytics />,
    "profile":           <Settings />,
    "settings":          <Settings />,
    "admin-settings":    <Settings />,
  };

  const page = pages[currentPage] ?? (
    currentUser.role === "admin"   ? <AdminDashboard />   :
    currentUser.role === "analyst" ? <AnalystDashboard /> :
                                     <UserDashboard />
  );

  return <CyberResolveLayout>{page}</CyberResolveLayout>;
}

export default function App() {
  return (
    <CyberResolveProvider>
      <PageRenderer />
    </CyberResolveProvider>
  );
}

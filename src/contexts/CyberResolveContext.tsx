import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../services/authService";
import type { User } from "../interfaces";

export type UserRole = "admin" | "analyst" | "user";

export interface CyberResolveUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rawRole: 'Admin' | 'Analyst';
  avatar: string;
  department: string;
  lastLogin: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "pending" | "resolved" | "closed";
  description: string;
  submittedBy: string;
  assignedTo?: string;
  dateSubmitted: string;
  lastUpdated: string;
  location: string;
  attachments: number;
  updates: TicketUpdate[];
}

export interface TicketUpdate {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  message: string;
  type: "note" | "status" | "assignment" | "resolution";
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  activityType: string;
  details: string;
}

export const MOCK_TICKETS: Ticket[] = [];

export const MOCK_USERS: ManagedUser[] = [];

export const MOCK_AUDIT: AuditEntry[] = [];

interface CyberResolveContextType {
  currentUser: CyberResolveUser | null;
  currentPage: string;
  selectedTicketId: string | null;
  notifications: number;
  justLoggedIn: boolean;
  initializing: boolean;
  clearJustLoggedIn: () => void;
  login: (email: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  navigate: (page: string, ticketId?: string) => void;
}

export const CyberResolveContext = createContext<CyberResolveContextType | null>(null);

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "U";
}

function mapRole(primaryRole: User["primary_role"]): UserRole {
  // primaryRole is the slug from roles table: "administrator", "security-analyst", or "user"
  if (primaryRole === "administrator") return "admin";
  if (primaryRole === "security-analyst") return "analyst";
  if (primaryRole === "user") return "user";
  
  // Default to user for safety
  return "user";
}

function mapUser(user: any): CyberResolveUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: mapRole(user.primary_role),
    rawRole: user.roles?.[0]?.name ?? "User",
    avatar: getInitials(user.name),
    department: user.department ?? "Unassigned",
    lastLogin: user.last_login_at ?? "Never",
  };
}

export function CyberResolveProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CyberResolveUser | null>(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [notifications] = useState(0);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Only attempt to fetch the current user if we have a stored auth token.
    const token = localStorage.getItem('cits_auth_token');
    if (!token) {
      setInitializing(false);
      return () => {
        mounted = false;
      };
    }

    getCurrentUser()
      .then(({ user }) => {
        if (!mounted) {
          return;
        }

        const mappedUser = mapUser(user);
        setCurrentUser(mappedUser);
        setCurrentPage(
          mappedUser.role === "admin"
            ? "admin-dashboard"
            : mappedUser.role === "analyst"
              ? "analyst-dashboard"
              : "user-dashboard",
        );
      })
      .catch(() => {
        // Token is invalid/expired, remove it
        if (mounted) {
          localStorage.removeItem('cits_auth_token');
        }
      })
      .finally(() => {
        if (mounted) {
          setInitializing(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string, remember: boolean): Promise<boolean> => {
    try {
      const { user } = await apiLogin({ email, password, remember });
      const mappedUser = mapUser(user);
      setCurrentUser(mappedUser);
      setJustLoggedIn(true);
      if (mappedUser.role === "admin") setCurrentPage("admin-dashboard");
      else if (mappedUser.role === "analyst") setCurrentPage("analyst-dashboard");
      else setCurrentPage("user-dashboard");
      return true;
    } catch {
      return false;
    }
  };

  const clearJustLoggedIn = () => setJustLoggedIn(false);

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout failures and clear local state.
    }

    setCurrentUser(null);
    setCurrentPage("login");
    setJustLoggedIn(false);
  };

  const navigate = (page: string, ticketId?: string) => {
    setCurrentPage(page);
    if (ticketId) setSelectedTicketId(ticketId);
  };

  return (
    <CyberResolveContext.Provider value={{ currentUser, currentPage, selectedTicketId, notifications, justLoggedIn, initializing, clearJustLoggedIn, login, logout, navigate }}>
      {children}
    </CyberResolveContext.Provider>
  );
}

export function useCyberResolve() {
  const ctx = useContext(CyberResolveContext);
  if (!ctx) throw new Error("useCyberResolve must be used within CyberResolveProvider");
  return ctx;
}

export const severityColor = (s: string) => {
  if (s === "critical") return "text-red-700 bg-red-50 border-red-200";
  if (s === "high") return "text-blue-700 bg-blue-50 border-blue-200";
  if (s === "medium") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
};

export const statusColor = (s: string) => {
  if (s === "new") return "text-blue-700 bg-blue-50 border-blue-200";
  if (s === "investigating") return "text-purple-700 bg-purple-50 border-purple-200";
  if (s === "contained") return "text-cyan-700 bg-cyan-50 border-cyan-200";
  if (s === "eradicated") return "text-orange-700 bg-orange-50 border-orange-200";
  if (s === "recovering") return "text-amber-700 bg-amber-50 border-amber-200";
  if (s === "closed") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  return "text-stone-600 bg-stone-100 border-stone-200";
};

export const statusLabel = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());

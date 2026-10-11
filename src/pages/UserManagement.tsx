import { useEffect, useState } from "react";
import { Users, Plus, Search, Edit3, Trash2, UserCheck, UserX, ChevronDown, X, Shield, Loader2 } from "lucide-react";
import { listUsers, createUser, updateUser, deleteUser as apiDeleteUser } from "../services/userService";
import { getLookups } from "../services/lookupService";
import type { ManagedUser, UserRole } from "../contexts/CyberResolveContext";
import type { User as ApiUser } from "../interfaces/user";
import type { Role, UserRoleSlug } from "../interfaces/role";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const roleColor = (r: string) => r === "admin" ? "#c2410c" : r === "analyst" ? "#3f6b7a" : "#b25b28";
const roleLabel = (r: string) => r === "admin" ? "Administrator" : r === "analyst" ? "Security Analyst" : "Employee";

const roleToSlug = (r: UserRole): UserRoleSlug => r === "admin" ? "administrator" : r === "analyst" ? "security-analyst" : "user";

type User = ManagedUser;

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  department: string;
  job_title: string;
  role: UserRole;
  status: "active" | "inactive";
  password: string;
  password_confirmation: string;
}

function UserModal({
  user,
  rawUser,
  roles,
  onClose,
  onSave,
}: {
  user?: User | null;
  rawUser?: ApiUser | null;
  roles: Role[];
  onClose: () => void;
  onSave: (form: UserFormState) => Promise<string | null>; // returns error message, or null on success
}) {
  const [form, setForm] = useState<UserFormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: rawUser?.phone ?? "",
    department: user?.department ?? "",
    job_title: rawUser?.job_title ?? "",
    role: user?.role ?? "user",
    status: user?.status ?? "active",
    password: "",
    password_confirmation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (k: keyof UserFormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setError("");
    if (!user && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password && form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    const errMsg = await onSave(form);
    setSaving(false);
    if (errMsg) {
      setError(errMsg);
    } else {
      onClose();
    }
  };

  const rolesAvailable = roles.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,31,27,0.35)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ background: "#ffffff", border: `1px solid ${BORDER}`, boxShadow: "0 25px 60px rgba(60,45,30,0.18)" }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: `1px solid ${BORDER}`, background: "#ffffff" }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: "#b25b28" }} />
            <h2 className="font-semibold" style={{ color: "#241f1b" }}>{user ? "Edit User" : "Add New User"}</h2>
          </div>
          <button onClick={onClose}><X className="h-4 w-4" style={{ color: "#9b9186" }} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
              {error}
            </div>
          )}
          {[
            { label: "Full Name", key: "name" as const, type: "text", placeholder: "Enter full name" },
            { label: "Email Address", key: "email" as const, type: "email", placeholder: "Enter email address" },
            { label: "Phone", key: "phone" as const, type: "text", placeholder: "Enter phone number" },
            { label: "Department", key: "department" as const, type: "text", placeholder: "Enter department" },
            { label: "Job Title", key: "job_title" as const, type: "text", placeholder: "Enter job title" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#4a453e" }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder} disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none disabled:opacity-60"
                style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#4a453e" }}>Role</label>
            <div className="relative">
              <select value={form.role} onChange={e => update("role", e.target.value)} disabled={saving || !rolesAvailable}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none appearance-none disabled:opacity-60"
                style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }}>
                <option value="user">Employee</option>
                <option value="analyst">Security Analyst</option>
                <option value="admin">Administrator</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#9b9186" }} />
            </div>
            {!rolesAvailable && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>Roles are still loading — please wait a moment.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#4a453e" }}>
              {user ? "New Password" : "Password"} {user && <span className="font-normal" style={{ color: "#9b9186" }}>(leave blank to keep current)</span>}
            </label>
            <input type="password" value={form.password} onChange={e => update("password", e.target.value)}
              placeholder="Min. 8 characters, mixed case, number, symbol" disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none disabled:opacity-60"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
          </div>
          {(form.password || !user) && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#4a453e" }}>Confirm Password</label>
              <input type="password" value={form.password_confirmation} onChange={e => update("password_confirmation", e.target.value)}
                placeholder="Re-enter password" disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none disabled:opacity-60"
                style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#7a746c" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !rolesAvailable}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#b25b28" }}>
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (user ? "Save Changes" : "Create User")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [rawUsers, setRawUsers] = useState<Record<string, ApiUser>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mapApiUser = (user: ApiUser): ManagedUser => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.primary_role === "administrator" ? "admin" : user.primary_role === "security-analyst" ? "analyst" : "user",
    department: user.department ?? "Unassigned",
    status: user.status === "suspended" ? "inactive" : user.status,
    lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never",
    createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
  });

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await listUsers({ page: 1 });
      setUsers(response.data.map(mapApiUser));
      const rawMap: Record<string, ApiUser> = {};
      response.data.forEach(u => { rawMap[String(u.id)] = u; });
      setRawUsers(rawMap);
    } catch (err: unknown) {
      console.error("Failed to load users:", err);
      setError("Unable to load users from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    loadUsers();

    getLookups()
      .then(data => { if (active) setRoles(data.roles); })
      .catch(err => console.error("Failed to load roles:", err));

    return () => {
      active = false;
    };
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)) &&
      (filterRole === "all" || u.role === filterRole) &&
      (filterStatus === "all" || u.status === filterStatus)
    );
  });

  const buildRoleIds = (role: UserRole): number[] => {
    const slug = roleToSlug(role);
    const match = roles.find(r => r.slug === slug);
    return match ? [match.id] : [];
  };

  const extractErrorMessage = (err: any): string => {
    const data = err?.response?.data;
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey) {
        return data.errors[firstKey]?.[0] ?? data.message ?? "Something went wrong.";
      }
    }
    return data?.message ?? "Something went wrong. Please try again.";
  };

  const saveUser = async (form: UserFormState): Promise<string | null> => {
    const role_ids = buildRoleIds(form.role);
    if (role_ids.length === 0) return "Selected role could not be resolved. Please try again.";

    const basePayload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      department: form.department,
      job_title: form.job_title,
      status: form.status,
      role_ids,
    };

    try {
      if (modal === "edit" && editUser) {
        const payload = form.password
          ? { ...basePayload, password: form.password, password_confirmation: form.password_confirmation }
          : basePayload;
        await updateUser(Number(editUser.id), payload as any);
      } else {
        await createUser({ ...basePayload, password: form.password, password_confirmation: form.password_confirmation });
      }
      await loadUsers();
      return null;
    } catch (err: any) {
      console.error("Failed to save user:", err);
      return extractErrorMessage(err);
    }
  };

  const removeUser = async (id: string) => {
    setDeleting(true);
    setDeleteError("");
    try {
      await apiDeleteUser(Number(id));
      setDeleteUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      setDeleteError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const current = users.find(u => u.id === id);
    const raw = rawUsers[id];
    if (!current) return;

    const newStatus = current.status === "active" ? "inactive" : "active";
    const role_ids = buildRoleIds(current.role);
    if (role_ids.length === 0) return;

    setTogglingId(id);
    try {
      await updateUser(Number(id), {
        name: current.name,
        email: current.email,
        phone: raw?.phone ?? "",
        department: current.department,
        job_title: raw?.job_title ?? "",
        status: newStatus,
        role_ids,
      });
      await loadUsers();
    } catch (err: any) {
      console.error("Failed to update user status:", err);
      alert(extractErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {modal && (
        <UserModal
          user={modal === "edit" ? editUser : null}
          rawUser={modal === "edit" && editUser ? rawUsers[editUser.id] : null}
          roles={roles}
          onClose={() => { setModal(null); setEditUser(null); }}
          onSave={saveUser}
        />
      )}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,31,27,0.35)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "#ffffff", border: `1px solid rgba(185,28,28,0.22)`, boxShadow: "0 25px 60px rgba(60,45,30,0.18)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(185,28,28,0.07)", border: "1px solid rgba(185,28,28,0.22)" }}>
              <Trash2 className="h-6 w-6" style={{ color: "#b91c1c" }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: "#241f1b" }}>Delete User?</h3>
            <p className="text-sm mb-3" style={{ color: "#7a746c" }}>Permanently remove <strong style={{ color: "#241f1b" }}>{deleteUser.name}</strong>? This action cannot be undone.</p>
            {deleteError && (
              <p className="text-sm mb-3 p-2 rounded-lg" style={{ background: "rgba(185,28,28,0.06)", color: "#b91c1c" }}>{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteUser(null); setDeleteError(""); }} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm disabled:opacity-60"
                style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#7a746c" }}>Cancel</button>
              <button onClick={() => removeUser(deleteUser.id)} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "#b91c1c" }}>
                {deleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>User Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>{users.length} registered users · Role-based access control</p>
        </div>
        <button onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#b25b28", boxShadow: "0 4px 16px rgba(178,91,40,0.28)" }}>
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Combined stats + filters toolbar */}
      <div className="rounded-xl p-4 flex flex-col xl:flex-row xl:items-center gap-4" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-5 xl:pr-5 xl:border-r" style={{ borderColor: BORDER }}>
          {[
            { label: "Total", value: users.length, color: "#b25b28" },
            { label: "Active", value: users.filter(u => u.status === "active").length, color: "#15803d" },
            { label: "Inactive", value: users.filter(u => u.status === "inactive").length, color: "#dc4444" },
            { label: "Analysts", value: users.filter(u => u.role === "analyst").length, color: "#3f6b7a" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9b9186" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9b9186" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or department..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }} />
          </div>
          {[
            { label: "Role", value: filterRole, set: setFilterRole, options: [["all", "All Roles"], ["admin", "Administrator"], ["analyst", "Analyst"], ["user", "Employee"]] },
            { label: "Status", value: filterStatus, set: setFilterStatus, options: [["all", "All Status"], ["active", "Active"], ["inactive", "Inactive"]] },
          ].map(f => (
            <div key={f.label} className="relative">
              <select value={f.value} onChange={e => f.set(e.target.value)}
                className="pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
                {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9b9186" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
          <Users className="h-4 w-4" style={{ color: "#b25b28" }} />
          <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>System Users</h2>
          <span className="ml-auto text-xs" style={{ color: "#a89e92" }}>{filtered.length} of {users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["User", "Email", "Role", "Department", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#a89e92" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "#a89e92" }}>Loading users...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "#b91c1c" }}>{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "#a89e92" }}>No users available.</td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="transition-colors hover:bg-[rgba(178,91,40,0.04)]"
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${roleColor(u.role)}18`, border: `1px solid ${roleColor(u.role)}30`, color: roleColor(u.role) }}>
                        {u.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#241f1b" }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "#9b9186" }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap"
                      style={{ color: roleColor(u.role), background: `${roleColor(u.role)}12`, borderColor: `${roleColor(u.role)}30` }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#9b9186" }}>{u.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${u.status === "active" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-stone-500 bg-stone-100 border-stone-200"}`}>
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9b9186" }}>{u.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditUser(u); setModal("edit"); }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(178,91,40,0.1)]" style={{ color: "#9b9186" }} title="Edit">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleStatus(u.id)} disabled={togglingId === u.id}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(194,135,31,0.1)] disabled:opacity-50"
                        style={{ color: "#9b9186" }}
                        title={u.status === "active" ? "Deactivate" : "Activate"}>
                        {togglingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : u.status === "active" ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setDeleteUser(u)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(185,28,28,0.1)]" style={{ color: "#9b9186" }} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

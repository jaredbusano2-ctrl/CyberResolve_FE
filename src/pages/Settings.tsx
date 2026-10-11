import { useState } from "react";
import { User, Lock, Shield, Save, Eye, EyeOff } from "lucide-react";
import { useCyberResolve } from "../contexts/CyberResolveContext";
import { updateProfile } from "../services/authService";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

export default function Settings() {
  const { currentUser } = useCyberResolve();
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: "",
    department: currentUser?.department ?? "",
    job_title: "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile(profile);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Profile</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9b9186" }}>Manage your account information and password.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(21,128,61,0.07)", border: "1px solid rgba(21,128,61,0.2)", color: "#15803d" }}>
          <Shield className="h-4 w-4" /> Changes saved
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl p-6 space-y-5" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: "#241f1b" }}><User className="h-4 w-4" style={{ color: "#b25b28" }} /> Profile Information</h2>
          <div className="space-y-4">
            {[
              { label: "Full Name", key: "name", type: "text" },
              { label: "Email Address", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "text" },
              { label: "Department", key: "department", type: "text" },
              { label: "Job Title", key: "job_title", type: "text" },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#9b9186" }}>{field.label}</label>
                <input
                  type={field.type}
                  value={profile[field.key as keyof typeof profile]}
                  onChange={event => setProfile(prev => ({ ...prev, [field.key]: event.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6 space-y-4 self-start" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: "#241f1b" }}><Lock className="h-4 w-4" style={{ color: "#b25b28" }} /> Change Password</h2>
          <div className="space-y-4">
            {[
              { label: "Current Password", key: "current_password" },
              { label: "New Password", key: "password" },
              { label: "Confirm New Password", key: "password_confirmation" },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs mb-1.5" style={{ color: "#9b9186" }}>{field.label}</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={profile[field.key as keyof typeof profile]}
                    onChange={event => setProfile(prev => ({ ...prev, [field.key]: event.target.value }))}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none"
                    style={{ background: "#faf8f5", border: `1px solid ${BORDER}`, color: "#241f1b" }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9b9186" }}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "#b25b28" }}>
        <Save className="h-4 w-4" /> Save Changes
      </button>
    </div>
  );
}

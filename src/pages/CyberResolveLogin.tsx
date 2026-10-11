import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import InfoSecLogo from "../../Logo/Logo.jpg";
import { useCyberResolve } from "../contexts/CyberResolveContext";

// Deterministic pseudo-barcode bars (stable across renders)
const BARCODE_WIDTHS = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 1];

export default function CyberResolveLogin() {
  const { login } = useCyberResolve();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const ok = await login(email, password, remember);
    if (!ok) setError("Invalid credentials. Use a registered account.");
    setLoading(false);
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 600));
    setForgotSent(true);
  };

  const today = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date());

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f0ebe3" }}>
      <div className="w-full max-w-3xl flex shadow-2xl" style={{ borderRadius: "16px", overflow: "visible" }}>

        {/* ===== Main ticket body ===== */}
        <div className="flex-1 bg-white p-10 sm:p-12 relative" style={{ borderRadius: "16px 0 0 16px" }}>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ background: "#fdfaf7", border: "1px solid rgba(178,91,40,0.28)" }}>
              <img src={InfoSecLogo} alt="CyberResolve" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-semibold leading-tight" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>CyberResolve</p>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#9b9186", fontFamily: "var(--font-mono)" }}>Access Terminal</p>
            </div>
          </div>

          {!showForgot ? (
            <>
              <p className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: "#94481d", fontFamily: "var(--font-mono)" }}>Personnel Sign-In</p>
              <h1 className="text-2xl font-semibold mb-7" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Present your credentials</h1>

              {error && (
                <div className="mb-5 py-2.5 px-3 rounded-lg text-sm font-mono" style={{ background: "rgba(220,68,68,0.06)", color: "#b91c1c" }}>
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: "#9b9186", fontFamily: "var(--font-mono)" }}>Field 01 — Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm outline-none rounded-md transition-colors"
                    style={{ background: "#faf8f5", border: "1px solid rgba(36,31,27,0.14)", color: "#241f1b" }}
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#9b9186", fontFamily: "var(--font-mono)" }}>Field 02 — Password</label>
                    <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] font-semibold" style={{ color: "#94481d" }}>FORGOT?</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm outline-none rounded-md transition-colors"
                      style={{ background: "#faf8f5", border: "1px solid rgba(36,31,27,0.14)", color: "#241f1b" }}
                      placeholder="••••••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9b9186" }}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5 rounded" style={{ accentColor: "#b25b28" }} />
                  <span className="text-sm" style={{ color: "#7a746c" }}>Keep this terminal authorized</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "#b25b28", color: "#fff8f2" }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#ffffff" }} />
                      Validating access…
                    </>
                  ) : (
                    <>
                      Authorize entry
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="flex items-center gap-2 mb-7 text-sm" style={{ color: "#9b9186" }}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign-in
              </button>
              {!forgotSent ? (
                <>
                  <p className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: "#94481d", fontFamily: "var(--font-mono)" }}>Credential Recovery</p>
                  <h1 className="text-2xl font-semibold mb-7" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Reset your password</h1>
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: "#9b9186", fontFamily: "var(--font-mono)" }}>Registered Email</label>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm outline-none rounded-md"
                        style={{ background: "#faf8f5", border: "1px solid rgba(36,31,27,0.14)", color: "#241f1b" }}
                        placeholder="you@company.com" required />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-md font-semibold text-sm"
                      style={{ background: "#b25b28", color: "#fff8f2" }}>
                      Send reset link
                    </button>
                  </form>
                </>
              ) : (
                <div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(47,158,110,0.1)" }}>
                    <ShieldCheck className="h-6 w-6" style={{ color: "#2f9e6e" }} />
                  </div>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Check your email</h2>
                  <p className="text-sm" style={{ color: "#9b9186" }}>We've sent a password reset link. It expires in 15 minutes.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== Perforated divider ===== */}
        <div className="relative hidden sm:block" style={{ width: "1px" }}>
          <div className="absolute inset-y-0 left-0 w-px" style={{ borderLeft: "2px dashed rgba(36,31,27,0.2)" }} />
          <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full" style={{ background: "#f0ebe3" }} />
          <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full" style={{ background: "#f0ebe3" }} />
        </div>

        {/* ===== Ticket stub ===== */}
        <div className="hidden sm:flex flex-col justify-between p-6 w-44 shrink-0" style={{ background: "#1c150f", borderRadius: "0 16px 16px 0" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: "rgba(253,250,247,0.45)", fontFamily: "var(--font-mono)" }}>Access Slip</p>
            <p className="text-sm font-semibold" style={{ color: "#fdfaf7", fontFamily: "var(--font-mono)" }}>SEC-{today.replace(/[, ]/g, "").slice(0, 7).toUpperCase()}</p>
          </div>

          <div className="space-y-2 my-6" style={{ writingMode: "horizontal-tb" }}>
            <div className="flex justify-between text-[10px]" style={{ color: "rgba(253,250,247,0.5)", fontFamily: "var(--font-mono)" }}>
              <span>DATE</span><span style={{ color: "#d99a5f" }}>{today}</span>
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: "rgba(253,250,247,0.5)", fontFamily: "var(--font-mono)" }}>
              <span>TIER</span><span style={{ color: "#d99a5f" }}>SECURE</span>
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: "rgba(253,250,247,0.5)", fontFamily: "var(--font-mono)" }}>
              <span>ENC</span><span style={{ color: "#d99a5f" }}>TLS 1.3</span>
            </div>
          </div>

          {/* Barcode */}
          <div className="flex items-end gap-[2px] h-10 mb-2">
            {BARCODE_WIDTHS.map((w, i) => (
              <div key={i} style={{ width: `${w}px`, height: "100%", background: "rgba(253,250,247,0.55)" }} />
            ))}
          </div>
          <p className="text-[9px] text-center tracking-[0.2em]" style={{ color: "rgba(253,250,247,0.35)", fontFamily: "var(--font-mono)" }}>DO NOT SHARE</p>
        </div>
      </div>
    </div>
  );
}

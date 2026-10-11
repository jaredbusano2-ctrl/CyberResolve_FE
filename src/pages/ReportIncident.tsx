import { useEffect, useState, type FormEvent } from "react";
import { FileWarning, Upload, X, CheckCircle2, AlertTriangle, Shield, ChevronDown, Calendar, MapPin, FileText } from "lucide-react";
import { useCyberResolve } from "../contexts/CyberResolveContext";
import { createIncident } from "../services/incidentService";
import { getLookups } from "../services/lookupService";
import type { IncidentCategory, SeverityLevel } from "../interfaces";

const CARD = "#ffffff";
const BORDER = "rgba(36,31,27,0.09)";

const SEVERITY_OPTIONS = [
  { value: "low",      label: "Low",      color: "#2f9e6e", desc: "Minor impact, no sensitive data involved" },
  { value: "medium",   label: "Medium",   color: "#c2871f", desc: "Moderate impact, limited exposure" },
  { value: "high",     label: "High",     color: "#2563eb", desc: "Significant impact, potential data loss" },
  { value: "critical", label: "Critical", color: "#dc4444", desc: "Severe impact, immediate response required" },
];

export default function ReportIncident() {
  const { navigate } = useCyberResolve();
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", category: "", severity: "" as SeverityLevel | "", description: "",
    datetime: "", location: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.category) e.category = "Select a category";
    if (!form.severity) e.severity = "Select severity level";
    if (form.description.trim() && form.description.length < 20) e.description = "Description must be at least 20 characters";
    if (!form.datetime) e.datetime = "Date and time is required";
    if (!form.location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity as SeverityLevel,
        category_id: Number(form.category),
        location: form.location.trim(),
        occurred_at: form.datetime,
      };

      const response = await createIncident(payload);
      setTicketId(response.incident.ticket_number);
      setSubmitted(true);
    } catch {
      setErrors({ form: "Unable to submit incident. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFile = (name: string) => setFiles(p => [...p, name]);
  const removeFile = (i: number) => setFiles(p => p.filter((_, idx) => idx !== i));

  useEffect(() => {
    let isMounted = true;

    getLookups().then((data) => {
      if (!isMounted) return;
      setCategories(data.incidentCategories);
    }).catch(() => {
      setErrors((previous) => ({ ...previous, form: 'Unable to load incident categories. Please refresh.' }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (submitted) return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "rgba(21,128,61,0.08)", border: "2px solid rgba(21,128,61,0.25)" }}>
        <CheckCircle2 className="h-10 w-10" style={{ color: "#15803d" }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "#241f1b" }}>Incident Reported Successfully</h2>
      {ticketId && (
        <div className="my-4 px-6 py-3 rounded-xl" style={{ background: "rgba(178,91,40,0.08)", border: "1px solid rgba(178,91,40,0.2)" }}>
          <p className="text-sm" style={{ color: "#9b9186" }}>Ticket ID</p>
          <p className="font-mono text-2xl font-bold" style={{ color: "#94481d" }}>{ticketId}</p>
        </div>
      )}
      <p className="mb-1" style={{ color: "#7a746c" }}>Your incident has been logged and assigned a ticket ID.</p>
      <p className="text-sm mb-6" style={{ color: "#9b9186" }}>A Security Analyst will review your report within 4 hours. You will receive email notifications on status updates.</p>
      <div className="flex gap-3">
        <button onClick={() => navigate("my-tickets")}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: "#b25b28" }}>
          View My Tickets
        </button>
        <button onClick={() => { setSubmitted(false); setForm({ title:"",category:"",severity:"",description:"",datetime:"",location:"" }); setFiles([]); }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#4a453e" }}>
          Report Another
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(185,28,28,0.08)", border: "1px solid rgba(185,28,28,0.2)" }}>
          <FileWarning className="h-5 w-5" style={{ color: "#b91c1c" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#241f1b", fontFamily: "var(--font-display)" }}>Report Security Incident</h1>
          <p className="text-sm" style={{ color: "#9b9186" }}>All reports are encrypted and handled confidentially</p>
        </div>
      </div>

      {/* Notice */}
      <div className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: "rgba(185,28,28,0.05)", border: "1px solid rgba(185,28,28,0.16)" }}>
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#b91c1c" }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: "#b91c1c" }}>If this is an active emergency</p>
          <p className="text-xs mt-0.5" style={{ color: "#9b9186" }}>Contact the SOC hotline immediately: <span className="font-mono" style={{ color: "#b91c1c" }}>+1-800-SEC-OPS1</span> or raise a Critical alert below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(60,45,30,0.06)" }}>
          <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
            <Shield className="h-4 w-4" style={{ color: "#b25b28" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#241f1b" }}>Incident Information</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Incident Title <span style={{ color: "#dc4444" }}>*</span></label>
              <input value={form.title} onChange={e => update("title", e.target.value)}
                placeholder="Brief descriptive title of the incident"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "#faf8f5", border: `1px solid ${errors.title ? "#dc4444" : BORDER}`, color: "#241f1b" }} />
              {errors.title && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>{errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Incident Category <span style={{ color: "#dc4444" }}>*</span></label>
              <div className="relative">
                <select value={form.category} onChange={e => update("category", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none"
                  style={{ background: "#faf8f5", border: `1px solid ${errors.category ? "#dc4444" : BORDER}`, color: form.category ? "#241f1b" : "#a89e92" }}>
                  <option value="" disabled>Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#9b9186" }} />
              </div>
              {errors.category && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>{errors.category}</p>}
            </div>

            {/* Date/time */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Date & Time of Incident <span style={{ color: "#dc4444" }}>*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9b9186" }} />
                <input type="datetime-local" value={form.datetime} onChange={e => update("datetime", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none"
                  style={{ background: "#faf8f5", border: `1px solid ${errors.datetime ? "#dc4444" : BORDER}`, color: "#241f1b" }} />
              </div>
              {errors.datetime && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>{errors.datetime}</p>}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Location / Affected System <span style={{ color: "#dc4444" }}>*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9b9186" }} />
                <input value={form.location} onChange={e => update("location", e.target.value)}
                  placeholder="e.g. Finance Department, Server Room, Remote Workstation, Cloud Environment"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none"
                  style={{ background: "#faf8f5", border: `1px solid ${errors.location ? "#dc4444" : BORDER}`, color: "#241f1b" }} />
              </div>
              {errors.location && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>{errors.location}</p>}
            </div>

            {/* Severity */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-3" style={{ color: "#4a453e" }}>Severity Level <span style={{ color: "#dc4444" }}>*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEVERITY_OPTIONS.map(s => (
                  <button type="button" key={s.value}
                    onClick={() => update("severity", s.value)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${form.severity === s.value ? s.color : BORDER}`,
                      background: form.severity === s.value ? `${s.color}12` : "#faf8f5"
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="font-bold text-sm" style={{ color: "#241f1b" }}>{s.label}</span>
                    </div>
                    <p className="text-xs" style={{ color: "#9b9186" }}>{s.desc}</p>
                  </button>
                ))}
              </div>
              {errors.severity && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>{errors.severity}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>
                Incident Description <span className="font-normal ml-2" style={{ color: "#9b9186" }}>(Optional)</span>
                <span className="font-normal ml-2" style={{ color: "#9b9186" }}>({form.description.length}/2000 chars)</span>
              </label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)}
                placeholder="Provide a detailed description: what happened, how it was discovered, what systems/data were affected, any actions already taken..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ background: "#faf8f5", border: `1px solid ${errors.description ? "#dc4444" : BORDER}`, color: "#241f1b" }} />
              {errors.description && <p className="text-xs mt-1" style={{ color: "#dc4444" }}>{errors.description}</p>}
            </div>

            {/* Evidence upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: "#4a453e" }}>Upload Evidence</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  Array.from(e.dataTransfer.files).forEach(f => addFile(f.name));
                }}
                className="rounded-xl p-6 text-center cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${dragOver ? "#b25b28" : BORDER}`,
                  background: dragOver ? "rgba(178,91,40,0.04)" : "#faf8f5"
                }}>
                <Upload className="h-8 w-8 mx-auto mb-3" style={{ color: "#9b9186" }} />
                <p className="text-sm" style={{ color: "#9b9186" }}>Drag & drop files here, or</p>
                <label className="mt-2 inline-block cursor-pointer text-sm font-medium underline" style={{ color: "#94481d" }}>
                  browse files
                  <input type="file" multiple className="hidden" onChange={e => {
                    Array.from(e.target.files ?? []).forEach(f => addFile(f.name));
                  }} />
                </label>
                <p className="text-xs mt-2" style={{ color: "#c9c2b8" }}>PNG, JPG, PDF, DOCX, PCAP up to 50MB each</p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: "rgba(178,91,40,0.06)", border: "1px solid rgba(178,91,40,0.18)" }}>
                      <FileText className="h-4 w-4 shrink-0" style={{ color: "#b25b28" }} />
                      <span className="text-sm flex-1 truncate" style={{ color: "#4a453e" }}>{f}</span>
                      <button type="button" onClick={() => removeFile(i)}><X className="h-4 w-4" style={{ color: "#9b9186" }} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(36,31,27,0.015)" }}>
            <p className="text-xs flex items-center gap-2" style={{ color: "#a89e92" }}>
              <Shield className="h-3 w-3" />
              This report is encrypted and logged with your credentials for audit purposes.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({ title:"",category:"",severity:"",description:"",datetime:"",location:"" })}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ background: "rgba(36,31,27,0.04)", border: `1px solid ${BORDER}`, color: "#7a746c" }}>
                Clear Form
              </button>
              <button type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#b25b28", boxShadow: "0 4px 16px rgba(178,91,40,0.28)" }}>
                {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </div>
          {errors.form && <p className="text-xs mt-3 px-6" style={{ color: "#dc4444" }}>{errors.form}</p>}
        </div>
      </form>
    </div>
  );
}

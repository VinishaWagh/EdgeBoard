import { useState, useRef, useCallback, useEffect } from "react";
import {
  LayoutGrid, BarChart2, Cpu, Search, Plus, Play, CheckCircle, RotateCcw,
  X, AlertTriangle, Clock, ChevronDown, Zap, TrendingUp, ListChecks, Timer,
  Flame, Eye, EyeOff, Github, Chrome, ArrowRight, Settings, PieChart,
  Bell, User, Shield, Trash2, ChevronRight, MessageCircle, Activity,
  Tag, Calendar, UserCheck, Pencil, MoreHorizontal, LogOut, RefreshCw,
} from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { taskService } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "critical" | "high" | "medium" | "low";
type Status = "pending" | "in-progress" | "completed" | "overdue";
type AppPage = "board" | "stats" | "analytics" | "settings" | "specs";
type AppState = "login" | "register" | "app";

interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface ActivityEntry {
  id: string;
  type: "created" | "status" | "comment" | "assigned";
  user: string;
  time: string;
  message: string;
}

interface Task {
  id: string;
  title: string;
  client: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  tags: string[];
  assigneeIds: string[];
  description: string;
  activity: ActivityEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSIGNEES: Assignee[] = [
  { id: "a1", name: "Jordan Lee",  initials: "JL", color: "#00ffa3" },
  { id: "a2", name: "Maya Chen",   initials: "MC", color: "#6e00ff" },
  { id: "a3", name: "Ravi Kumar",  initials: "RK", color: "#f59e0b" },
  { id: "a4", name: "Priya Nair",  initials: "PN", color: "#f43f5e" },
  { id: "a5", name: "Sam Torres",  initials: "ST", color: "#3b82f6" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  critical: { label: "CRITICAL", color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
  high:     { label: "HIGH",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  medium:   { label: "MEDIUM",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  low:      { label: "LOW",      color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  "pending":     { label: "PENDING",     color: "#cbd5e1" },
  "in-progress": { label: "IN PROGRESS", color: "#00ffa3" },
  "completed":   { label: "COMPLETED",   color: "#00ffa3" },
  "overdue":     { label: "OVERDUE",     color: "#f43f5e" },
};

const INITIAL_TASKS: Task[] = [
  {
    id: "t1", title: "Launch Social Campaign — Q3 Summer Drop", client: "NovaBrand",
    priority: "critical", status: "in-progress", dueDate: "2026-07-05",
    tags: ["social", "paid"], assigneeIds: ["a1", "a3"], description: "Full-funnel campaign rollout across Instagram Reels, TikTok, and Meta Ads for Q3 summer collection drop.",
    activity: [
      { id: "ac1", type: "created",  user: "Jordan Lee",  time: "3 days ago", message: "Task created and assigned to team." },
      { id: "ac2", type: "status",   user: "Ravi Kumar",  time: "2 days ago", message: "Status moved to In Progress." },
      { id: "ac3", type: "comment",  user: "Jordan Lee",  time: "6 hours ago", message: "Creative assets approved by client. Moving to scheduling." },
    ],
  },
  {
    id: "t2", title: "Redesign Landing Page Hero Section", client: "PulseWear",
    priority: "high", status: "pending", dueDate: "2026-07-10",
    tags: ["web", "design"], assigneeIds: ["a2"], description: "Revamp the above-the-fold section with new brand photography and motion headline.",
    activity: [
      { id: "ac4", type: "created", user: "Maya Chen", time: "1 day ago", message: "Task created." },
    ],
  },
  {
    id: "t3", title: "Influencer Brief Deck for TikTok Push", client: "DropZone",
    priority: "high", status: "in-progress", dueDate: "2026-07-03",
    tags: ["influencer", "video"], assigneeIds: ["a4", "a5"], description: "Create a detailed brief deck for 8 micro-influencers across streetwear and sports verticals.",
    activity: [
      { id: "ac5", type: "created",  user: "Priya Nair", time: "4 days ago", message: "Task created." },
      { id: "ac6", type: "assigned", user: "Sam Torres", time: "3 days ago", message: "Sam Torres added to task." },
      { id: "ac7", type: "comment",  user: "Priya Nair", time: "1 day ago",  message: "First draft of deck ready for review." },
    ],
  },
  {
    id: "t4", title: "Email Drip Sequence — Onboarding Flow", client: "ArcHQ",
    priority: "medium", status: "completed", dueDate: "2026-06-28",
    tags: ["email", "automation"], assigneeIds: ["a1"], description: "7-email onboarding drip covering product education, social proof, and first-purchase incentive.",
    activity: [
      { id: "ac8",  type: "created",  user: "Jordan Lee", time: "6 days ago", message: "Task created." },
      { id: "ac9",  type: "status",   user: "Jordan Lee", time: "2 days ago", message: "Marked as completed." },
    ],
  },
  {
    id: "t5", title: "SEO Audit & Content Gap Analysis", client: "NovaBrand",
    priority: "medium", status: "overdue", dueDate: "2026-06-20",
    tags: ["seo", "content"], assigneeIds: ["a2", "a3"], description: "Full technical SEO audit + competitive content gap analysis across 5 target keyword clusters.",
    activity: [
      { id: "ac10", type: "created", user: "Maya Chen", time: "10 days ago", message: "Task created." },
      { id: "ac11", type: "comment", user: "Ravi Kumar", time: "8 days ago", message: "Ahrefs crawl complete. Writing report." },
    ],
  },
  {
    id: "t6", title: "Paid Ads Creative — Meta Reels", client: "DropZone",
    priority: "critical", status: "pending", dueDate: "2026-07-01",
    tags: ["paid", "creative"], assigneeIds: ["a5"], description: "Design 6 video creative variants (9:16) for Meta Reels targeting 18-34 streetwear audience.",
    activity: [
      { id: "ac12", type: "created", user: "Sam Torres", time: "2 days ago", message: "Task created." },
    ],
  },
  {
    id: "t7", title: "Monthly Analytics Report — June", client: "PulseWear",
    priority: "low", status: "completed", dueDate: "2026-06-30",
    tags: ["reporting"], assigneeIds: ["a2"], description: "Compile full-funnel performance report: reach, engagement, conversions, and ROAS across all active channels.",
    activity: [
      { id: "ac13", type: "created", user: "Maya Chen",  time: "5 days ago", message: "Task created." },
      { id: "ac14", type: "status",  user: "Maya Chen",  time: "1 day ago",  message: "Report delivered to client." },
    ],
  },
  {
    id: "t8", title: "Brand Guidelines Refresh", client: "ArcHQ",
    priority: "high", status: "overdue", dueDate: "2026-06-15",
    tags: ["branding", "design"], assigneeIds: ["a4"], description: "Update brand guidelines document to include new typography system, updated color palette, and revised logo usage rules.",
    activity: [
      { id: "ac15", type: "created", user: "Priya Nair", time: "14 days ago", message: "Task created." },
    ],
  },
  {
    id: "t9", title: "YouTube Thumbnail A/B Test", client: "DropZone",
    priority: "low", status: "pending", dueDate: "2026-07-08",
    tags: ["video", "creative"], assigneeIds: ["a5"], description: "Design and test 3 thumbnail variants per video across the last 5 uploads to optimise CTR.",
    activity: [
      { id: "ac16", type: "created", user: "Sam Torres", time: "1 day ago", message: "Task created." },
    ],
  },
  {
    id: "t10", title: "CRM Integration — HubSpot Setup", client: "NovaBrand",
    priority: "medium", status: "in-progress", dueDate: "2026-07-12",
    tags: ["tech", "crm"], assigneeIds: ["a1", "a2"], description: "Configure HubSpot CRM pipeline stages, contact properties, and automation workflows aligned to sales process.",
    activity: [
      { id: "ac17", type: "created",  user: "Jordan Lee", time: "3 days ago", message: "Task created." },
      { id: "ac18", type: "status",   user: "Maya Chen",  time: "2 days ago", message: "Started pipeline configuration." },
      { id: "ac19", type: "comment",  user: "Jordan Lee", time: "5 hours ago", message: "Contacted HubSpot support re: API limits." },
    ],
  },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getAssignee(id: string) {
  return ASSIGNEES.find((a) => a.id === id);
}

// ─── Global styles ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes shiny { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,163,0.3); }
  select option { background: #0f1526; color: #fff; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
  .drawer-open { animation: slideRight 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  .page-enter { animation: fadeIn 0.25s ease forwards; }
`;

// ─── Base UI ──────────────────────────────────────────────────────────────────

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(0,255,163,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.025) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,27,75,0.65) 0%, transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 80% 80%, rgba(110,0,255,0.06) 0%, transparent 60%)" }} />
    </div>
  );
}

function SpotlightCard({ children, className = "", glowColor = "#00ffa3", onClick }: { children: React.ReactNode; className?: string; glowColor?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", borderColor: hovered ? `${glowColor}35` : "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", boxShadow: hovered ? `0 0 30px ${glowColor}10` : "none" }}>
      {hovered && <div className="absolute pointer-events-none" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", width: "300px", height: "300px", background: `radial-gradient(circle, ${glowColor}15 0%, transparent 70%)` }} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ShinyText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block ${className}`} style={{ background: "linear-gradient(90deg, #ffffff 0%, #00ffa3 40%, #ffffff 60%, #6e00ff 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shiny 4s linear infinite" }}>
      {children}
    </span>
  );
}

function Spinner() {
  return <div style={{ width: 18, height: 18, border: "2px solid rgba(11,15,25,0.3)", borderTopColor: "#0b0f19", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

function Avatar({ assignee, size = 28 }: { assignee: Assignee; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${assignee.color}20`, border: `1.5px solid ${assignee.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontFamily: "'Space Mono', monospace", color: assignee.color, flexShrink: 0, fontWeight: 700 }}>
      {assignee.initials}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (email: string, name: string) => void }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLoginSubmit = () => {
    if (!googleEmail.trim()) {
      setLoginError("Google email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(googleEmail)) {
      setLoginError("Please enter a valid Google email");
      return;
    }
    const name = googleName.trim() || googleEmail.split("@")[0];
    onLogin(googleEmail.trim(), name);
  };

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${hasErr ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10, color: "#fff", padding: "11px 14px", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: "relative", zIndex: 10 }}>
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 20px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: "#0b0f19" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: 14 }}>Sign in to your agency dashboard</p>
        </div>

        <SpotlightCard className="p-8" glowColor="#00ffa3">
          {!showPrompt ? (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowPrompt(true)}
                className="flex items-center justify-center gap-3 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{ background: "#fff", color: "#0b0f19", border: "1px solid #fff", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 0 20px rgba(255,255,255,0.15)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v3h3.84c2.25-2.07 3.54-5.12 3.54-8.73z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-3c-1.07.72-2.44 1.16-4.12 1.16-3.17 0-5.85-2.14-6.81-5.02H1.24v3.1A12 12 0 0 0 12 24z"/>
                  <path fill="#FBBC05" d="M5.19 14.23A7.17 7.17 0 0 1 4.8 12c0-.79.13-1.57.39-2.32V6.58H1.24A11.96 11.96 0 0 0 0 12c0 2.03.52 4 1.24 5.72l3.95-3.49z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.24 0 3.19 2.72 1.24 6.58l3.95 3.49c.96-2.88 3.64-5.32 6.81-5.32z"/>
                </svg>
                Sign In with Google
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, color: "#fff", fontWeight: 700, marginBottom: 8 }}>Google Account Sign-In</h2>
              
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Google Email</label>
                <input 
                  style={inputStyle(!!loginError)} 
                  type="email" 
                  placeholder="user@gmail.com" 
                  value={googleEmail} 
                  onChange={e => { setGoogleEmail(e.target.value); setLoginError(""); }} 
                />
              </div>

              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
                <input 
                  style={inputStyle(false)} 
                  type="text" 
                  placeholder="John Doe" 
                  value={googleName} 
                  onChange={e => setGoogleName(e.target.value)} 
                />
              </div>

              {loginError && <p style={{ color: "#f43f5e", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{loginError}</p>}
              
              <div className="flex gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowPrompt(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif" }}>
                  Back
                </button>
                <button 
                  type="button"
                  onClick={handleLoginSubmit}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 20px rgba(0,255,163,0.2)", fontFamily: "'DM Sans', sans-serif" }}>
                  Authenticate
                </button>
              </div>
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

function RegisterPage({ onRegister, onGoLogin }: { onRegister: () => void; onGoLogin: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", terms: false });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!form.terms) e.terms = "You must accept the terms";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegister(); }, 1600);
  };

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${hasErr ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10, color: "#fff", padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
  });

  const FieldErr = ({ k }: { k: string }) => errors[k] ? (
    <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{errors[k]}</p>
  ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: "relative", zIndex: 10 }}>
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 20px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: "#0b0f19" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: 14 }}>Join your team on EdgeBoard</p>
        </div>

        <SpotlightCard className="p-8" glowColor="#6e00ff">
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
              <input style={inputStyle(!!errors.name)} placeholder="Alex Rivera" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <FieldErr k="name" />
            </div>

            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input style={inputStyle(!!errors.email)} type="email" placeholder="you@agency.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <FieldErr k="email" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle(!!errors.password), paddingRight: 40 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <FieldErr k="password" />
              </div>
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Confirm</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle(!!errors.confirm), paddingRight: 40 }} type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                  <button onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <FieldErr k="confirm" />
              </div>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <div onClick={() => setForm({ ...form, terms: !form.terms })}
                  style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${form.terms ? "#00ffa3" : errors.terms ? "#f43f5e" : "rgba(255,255,255,0.2)"}`, background: form.terms ? "rgba(0,255,163,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0, transition: "all 0.2s" }}>
                  {form.terms && <CheckCircle size={11} style={{ color: "#00ffa3" }} />}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <span style={{ color: "#00ffa3" }}>Terms of Service</span> and{" "}
                  <span style={{ color: "#00ffa3" }}>Privacy Policy</span>
                </span>
              </label>
              <FieldErr k="terms" />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:scale-100"
              style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 24px rgba(0,255,163,0.3)", marginTop: 4 }}>
              {loading ? <><Spinner /> Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </div>
        </SpotlightCard>

        <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 20 }}>
          Already have an account?{" "}
          <button onClick={onGoLogin} style={{ color: "#00ffa3", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Sign in →</button>
        </p>
      </div>
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

function TaskModal({ initial, onClose, onSave }: { initial?: Task; onClose: () => void; onSave: (t: Task) => void }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    client: initial?.client ?? "",
    description: initial?.description ?? "",
    priority: (initial?.priority ?? "medium") as Priority,
    status: (initial?.status ?? "pending") as Status,
    dueDate: initial?.dueDate ?? "",
    tags: initial?.tags.join(", ") ?? "",
    assigneeIds: initial?.assigneeIds ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Task title is required";
    if (!form.client.trim()) e.client = "Client is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      id: initial?.id ?? `t${Date.now()}`,
      title: form.title, client: form.client, description: form.description,
      priority: form.priority, status: form.status, dueDate: form.dueDate,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      assigneeIds: form.assigneeIds,
      activity: initial?.activity ?? [{ id: `ac${Date.now()}`, type: "created", user: "You", time: "just now", message: "Task created." }],
    });
    onClose();
  };

  const toggleAssignee = (id: string) => {
    setForm(f => ({ ...f, assigneeIds: f.assigneeIds.includes(id) ? f.assigneeIds.filter(a => a !== id) : [...f.assigneeIds, id] }));
  };

  const inputCls: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };
  const errBorder = (k: string): React.CSSProperties => errors[k] ? { borderColor: "#f43f5e" } : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl p-7 page-enter" style={{ background: "rgba(12,18,34,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", boxShadow: "0 0 60px rgba(0,255,163,0.07), 0 40px 80px rgba(0,0,0,0.7)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{initial ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} style={{ color: "#64748b" }} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Task Title *</label>
            <input style={{ ...inputCls, ...errBorder("title") }} placeholder="e.g. Launch Summer Campaign" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            {errors.title && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.title}</p>}
          </div>

          {/* Client + Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Client *</label>
              <input style={{ ...inputCls, ...errBorder("client") }} placeholder="e.g. NovaBrand" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
              {errors.client && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.client}</p>}
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Due Date *</label>
              <input type="date" style={{ ...inputCls, colorScheme: "dark", ...errBorder("dueDate") }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              {errors.dueDate && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.dueDate}</p>}
            </div>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Priority", key: "priority", opts: [["critical","Critical"],["high","High"],["medium","Medium"],["low","Low"]] },
              { label: "Status",   key: "status",   opts: [["pending","Pending"],["in-progress","In Progress"],["completed","Completed"],["overdue","Overdue"]] },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <select style={{ ...inputCls, appearance: "none", cursor: "pointer", paddingRight: 32 } as React.CSSProperties} value={(form as Record<string, string>)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Description</label>
            <textarea style={{ ...inputCls, resize: "vertical", minHeight: 72, lineHeight: 1.6 }} placeholder="Task details, goals, or notes…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Tags (comma-separated)</label>
            <input style={inputCls} placeholder="social, design, video" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>

          {/* Assignees */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Assignees</label>
            <div className="flex flex-wrap gap-2">
              {ASSIGNEES.map(a => {
                const sel = form.assigneeIds.includes(a.id);
                return (
                  <button key={a.id} onClick={() => toggleAssignee(a.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
                    style={{ background: sel ? `${a.color}18` : "rgba(255,255,255,0.04)", border: `1.5px solid ${sel ? a.color + "60" : "rgba(255,255,255,0.08)"}`, cursor: "pointer" }}>
                    <Avatar assignee={a} size={22} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: sel ? "#fff" : "#64748b" }}>{a.name}</span>
                    {sel && <CheckCircle size={12} style={{ color: a.color }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 20px rgba(0,255,163,0.25)" }}>
            {initial ? "Save Changes" : "Create Task"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Details Drawer ──────────────────────────────────────────────────────

function TaskDrawer({ task, onClose, onEdit, onStatusChange }: { task: Task; onClose: () => void; onEdit: () => void; onStatusChange: (id: string, s: Status) => void }) {
  const p = PRIORITY_CONFIG[task.priority];
  const s = STATUS_CONFIG[task.status];
  const [comment, setComment] = useState("");

  const activityIcon = (type: ActivityEntry["type"]) => {
    if (type === "created") return <Plus size={11} />;
    if (type === "status") return <RefreshCw size={11} />;
    if (type === "assigned") return <UserCheck size={11} />;
    return <MessageCircle size={11} />;
  };

  return (
    <div className="fixed inset-0 z-40 flex" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="drawer-open w-full max-w-md h-full flex flex-col"
        style={{ background: "rgba(10,15,28,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: p.color, background: p.bg, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.08em" }}>{p.label}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: s.color, letterSpacing: "0.08em" }}>{s.label}</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1.4 }}>{task.title}</h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Pencil size={12} style={{ color: "#00ffa3" }} />
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={13} style={{ color: "#64748b" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User,     label: "Client",   value: task.client },
              { icon: Calendar, label: "Due Date",  value: formatDate(task.dueDate) },
              { icon: Tag,      label: "Tags",      value: task.tags.length ? task.tags.map(t => `#${t}`).join(" ") : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
                <div className="flex items-center gap-1.5 mb-1"><Icon size={11} style={{ color: "#64748b" }} /><span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span></div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" }}>{value}</p>
              </div>
            ))}

            {/* Assignees */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
              <div className="flex items-center gap-1.5 mb-2"><UserCheck size={11} style={{ color: "#64748b" }} /><span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Assignees</span></div>
              <div className="flex flex-wrap gap-1">
                {task.assigneeIds.length ? task.assigneeIds.map(id => {
                  const a = getAssignee(id);
                  return a ? <Avatar key={id} assignee={a} size={24} /> : null;
                }) : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748b" }}>Unassigned</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Description</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{task.description}</p>
            </div>
          )}

          {/* Status changer */}
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Change Status</p>
            <div className="flex flex-wrap gap-2">
              {(["pending","in-progress","completed","overdue"] as Status[]).map(st => {
                const cfg = STATUS_CONFIG[st];
                const active = task.status === st;
                return (
                  <button key={st} onClick={() => onStatusChange(task.id, st)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em", background: active ? `${cfg.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? cfg.color + "50" : "rgba(255,255,255,0.08)"}`, color: active ? cfg.color : "#64748b", cursor: "pointer" }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Activity</p>
            <div className="flex flex-col gap-4">
              {task.activity.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#00ffa3", marginTop: 1 }}>
                    {activityIcon(entry.type)}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" }}>{entry.message}</p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", marginTop: 2 }}>{entry.user} · {entry.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 mt-4">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", padding: "8px 12px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              <button onClick={() => setComment("")}
                style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)", color: "#00ffa3", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                Post
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, onOpen, onEdit }: { task: Task; onStatusChange: (id: string, s: Status) => void; onOpen: () => void; onEdit: () => void }) {
  const p = PRIORITY_CONFIG[task.priority];
  const s = STATUS_CONFIG[task.status];
  const isActive = task.status === "in-progress";
  const isOverdue = task.status === "overdue";

  return (
    <div className="relative rounded-xl overflow-hidden group" style={{ backdropFilter: "blur(12px)" }}>
      {isActive && (
        <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: "linear-gradient(#0b0f19, #0b0f19) padding-box, linear-gradient(90deg, #00ffa3, #6e00ff, #00ffa3) border-box", border: "1px solid transparent" }} />
      )}
      <div className="relative p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold leading-snug flex-1 cursor-pointer hover:text-[#00ffa3] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", color: "#fff" }} onClick={onOpen}>{task.title}</h3>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <Pencil size={10} style={{ color: "#64748b" }} />
            </button>
            <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ fontFamily: "'Space Mono', monospace", color: p.color, background: p.bg, letterSpacing: "0.08em" }}>{p.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#64748b" }}>{task.client}</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <Clock size={11} style={{ color: isOverdue ? "#f43f5e" : "#64748b" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: isOverdue ? "#f43f5e" : "#64748b" }}>{formatDate(task.dueDate)}</span>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map(tag => (
              <span key={tag} style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: s.color, letterSpacing: "0.08em" }}>{s.label}</span>
            {task.assigneeIds.length > 0 && (
              <div className="flex -space-x-1">
                {task.assigneeIds.slice(0, 3).map(id => { const a = getAssignee(id); return a ? <Avatar key={id} assignee={a} size={20} /> : null; })}
                {task.assigneeIds.length > 3 && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>+{task.assigneeIds.length - 3}</div>}
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            {task.status !== "in-progress" && task.status !== "completed" && (
              <button onClick={() => onStatusChange(task.id, "in-progress")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)" }}>
                <Play size={10} style={{ color: "#00ffa3" }} />
              </button>
            )}
            {task.status !== "completed" && (
              <button onClick={() => onStatusChange(task.id, "completed")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)" }}>
                <CheckCircle size={10} style={{ color: "#00ffa3" }} />
              </button>
            )}
            {task.status === "completed" && (
              <button onClick={() => onStatusChange(task.id, "pending")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)" }}>
                <RotateCcw size={10} style={{ color: "#64748b" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, body, action, onAction }: { icon: React.ElementType; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon size={26} style={{ color: "#374151" }} />
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 6 }}>{title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b", maxWidth: 280, lineHeight: 1.6, marginBottom: action ? 20 : 0 }}>{body}</p>
      {action && onAction && (
        <button onClick={onAction} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.03]"
          style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)", color: "#00ffa3" }}>
          {action}
        </button>
      )}
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Search size={26} style={{ color: "#374151" }} />
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 6 }}>No results found</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b", maxWidth: 260, lineHeight: 1.6, marginBottom: 20 }}>No tasks match your current search or filters. Try adjusting your criteria.</p>
      <button onClick={onClear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.03]"
        style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)", color: "#00ffa3" }}>
        <X size={14} /> Clear all filters
      </button>
    </div>
  );
}

// ─── Task Board ───────────────────────────────────────────────────────────────

function TaskBoard({ tasks, onStatusChange, onOpenCreate, onOpenEdit, onOpenDetail }: {
  tasks: Task[]; onStatusChange: (id: string, s: Status) => void;
  onOpenCreate: () => void; onOpenEdit: (t: Task) => void; onOpenDetail: (t: Task) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<"dueDate" | "priority" | "status">("dueDate");

  const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder: Record<Status, number> = { overdue: 0, "in-progress": 1, pending: 2, completed: 3 };

  const filtered = tasks
    .filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.client.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => sort === "dueDate" ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : sort === "priority" ? priorityOrder[a.priority] - priorityOrder[b.priority] : statusOrder[a.status] - statusOrder[b.status]);

  const selectStyle: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#cbd5e1", padding: "8px 30px 8px 12px", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: "0.04em", appearance: "none", cursor: "pointer", outline: "none" };
  const hasFilters = search || filterStatus !== "all" || filterPriority !== "all";

  return (
    <div className="page-enter">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Task Board</h1></ShinyText>
          <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Manage and execute all client work in one place.</p>
        </div>
        <button onClick={onOpenCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shrink-0 transition-all duration-200 hover:scale-[1.03]"
          style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 24px rgba(0,255,163,0.3)" }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
          <input className="w-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "9px 14px 9px 36px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            placeholder="Search tasks or clients…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { val: filterStatus,   set: setFilterStatus,   opts: [["all","All Status"],["pending","Pending"],["in-progress","In Progress"],["completed","Completed"],["overdue","Overdue"]] },
          { val: filterPriority, set: setFilterPriority, opts: [["all","All Priority"],["critical","Critical"],["high","High"],["medium","Medium"],["low","Low"]] },
          { val: sort,           set: setSort,           opts: [["dueDate","Sort: Due"],["priority","Sort: Priority"],["status","Sort: Status"]] },
        ].map(({ val, set, opts }, i) => (
          <div key={i} style={{ position: "relative" }}>
            <select style={selectStyle} value={val} onChange={e => (set as (v: string) => void)(e.target.value)}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={11} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
          </div>
        ))}
      </div>

      {tasks.length === 0
        ? <EmptyState icon={LayoutGrid} title="No tasks yet" body="Create your first task to start tracking client work across your team." action="Create Task" onAction={onOpenCreate} />
        : filtered.length === 0
          ? <NoResults onClear={() => { setSearch(""); setFilterStatus("all"); setFilterPriority("all"); }} />
          : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(task => <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onOpen={() => onOpenDetail(task)} onEdit={() => onOpenEdit(task)} />)}
            </div>
      }
    </div>
  );
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, glowColor }: { icon: React.ElementType; label: string; value: number; color: string; glowColor: string }) {
  return (
    <SpotlightCard className="p-5" glowColor={glowColor}>
      <div className="flex items-start justify-between mb-3">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color }} />
        </div>
        <TrendingUp size={13} style={{ color: `${color}50` }} />
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color, textShadow: `0 0 18px ${color}35`, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{label}</div>
    </SpotlightCard>
  );
}

function DashboardStats({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProg = tasks.filter(t => t.status === "in-progress").length;
  const done = tasks.filter(t => t.status === "completed").length;
  const over = tasks.filter(t => t.status === "overdue").length;

  return (
    <div className="page-enter">
      <div className="mb-8">
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Dashboard Stats</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Live overview across all clients and campaigns.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={ListChecks} label="Total"       value={total}   color="#cbd5e1" glowColor="#cbd5e1" />
        <StatCard icon={Timer}      label="Pending"     value={pending} color="#3b82f6" glowColor="#3b82f6" />
        <StatCard icon={Zap}        label="In Progress" value={inProg}  color="#00ffa3" glowColor="#00ffa3" />
        <StatCard icon={CheckCircle}label="Completed"   value={done}    color="#00ffa3" glowColor="#00ffa3" />
        <StatCard icon={Flame}      label="Overdue"     value={over}    color="#f43f5e" glowColor="#f43f5e" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "By Client", glow: "#00ffa3", items: ["NovaBrand","PulseWear","DropZone","ArcHQ"].map(c => ({ label: c, count: tasks.filter(t => t.client === c).length, color: "#00ffa3" })) },
          { title: "By Priority", glow: "#6e00ff", items: (["critical","high","medium","low"] as Priority[]).map(p => ({ label: PRIORITY_CONFIG[p].label, count: tasks.filter(t => t.priority === p).length, color: PRIORITY_CONFIG[p].color })) },
        ].map(({ title, glow, items }) => (
          <SpotlightCard key={title} className="p-6" glowColor={glow}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>{title}</h3>
            {items.map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" }}>{label}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b" }}>{count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${total ? Math.round((count / total) * 100) : 0}%`, background: color, transition: "width 0.7s ease" }} />
                </div>
              </div>
            ))}
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

const CHART_TOOLTIP_STYLE: React.CSSProperties = { background: "rgba(10,15,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" };

function AnalyticsPage({ tasks }: { tasks: Task[] }) {
  const statusData = [
    { name: "Pending",     value: tasks.filter(t => t.status === "pending").length,     color: "#3b82f6" },
    { name: "In Progress", value: tasks.filter(t => t.status === "in-progress").length, color: "#00ffa3" },
    { name: "Completed",   value: tasks.filter(t => t.status === "completed").length,   color: "#6e00ff" },
    { name: "Overdue",     value: tasks.filter(t => t.status === "overdue").length,     color: "#f43f5e" },
  ].filter(d => d.value > 0);

  const clientData = ["NovaBrand","PulseWear","DropZone","ArcHQ"].map(c => ({
    name: c,
    Total: tasks.filter(t => t.client === c).length,
    Done:  tasks.filter(t => t.client === c && t.status === "completed").length,
  }));

  const weeklyData = [
    { week: "W21", tasks: 2, completed: 1 },
    { week: "W22", tasks: 4, completed: 2 },
    { week: "W23", tasks: 3, completed: 3 },
    { week: "W24", tasks: 6, completed: 4 },
    { week: "W25", tasks: 5, completed: 2 },
    { week: "W26", tasks: 7, completed: 4 },
    { week: "W27", tasks: tasks.length, completed: tasks.filter(t => t.status === "completed").length },
  ];

  const trendData = [
    { date: "Jun 1",  velocity: 3, backlog: 8 },
    { date: "Jun 8",  velocity: 5, backlog: 9 },
    { date: "Jun 15", velocity: 4, backlog: 7 },
    { date: "Jun 22", velocity: 6, backlog: 6 },
    { date: "Jun 29", velocity: tasks.filter(t => t.status === "completed").length, backlog: tasks.filter(t => t.status !== "completed").length },
  ];

  const recentActivity = tasks.flatMap(t => t.activity.map(a => ({ ...a, taskTitle: t.title }))).slice(0, 8);

  return (
    <div className="page-enter">
      <div className="mb-8">
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Analytics</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Performance trends and delivery insights across all campaigns.</p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={BarChart2} title="No analytics data yet" body="Analytics will appear once tasks are created and tracked across your board." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie: Status */}
          <SpotlightCard className="p-6" glowColor="#00ffa3">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Task Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#cbd5e1" }}>{v}</span>} />
              </RechartsPie>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Bar: by client */}
          <SpotlightCard className="p-6" glowColor="#6e00ff">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Tasks by Client</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clientData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="Total" fill="#6e00ff" opacity={0.7} radius={[4,4,0,0]} />
                <Bar dataKey="Done"  fill="#00ffa3" opacity={0.85} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Bar: weekly volume */}
          <SpotlightCard className="p-6" glowColor="#3b82f6">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Weekly Task Volume</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="tasks"     fill="#3b82f6" opacity={0.6} radius={[4,4,0,0]} name="Created" />
                <Bar dataKey="completed" fill="#00ffa3" opacity={0.85} radius={[4,4,0,0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Area: trend */}
          <SpotlightCard className="p-6" glowColor="#f59e0b">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Velocity vs Backlog Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gVel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00ffa3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ffa3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="velocity" stroke="#00ffa3" fill="url(#gVel)" strokeWidth={2} name="Completed" dot={false} />
                <Area type="monotone" dataKey="backlog"  stroke="#f43f5e" fill="url(#gBack)" strokeWidth={2} name="Backlog"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Activity feed */}
          <SpotlightCard className="p-6 lg:col-span-2" glowColor="#64748b">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Recent Activity</h3>
            {recentActivity.length === 0
              ? <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b" }}>No activity yet.</p>
              : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentActivity.map((entry, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#00ffa3" }}>
                        <Activity size={10} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>{entry.message}</p>
                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", marginTop: 3 }}>{entry.taskTitle} · {entry.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </SpotlightCard>
        </div>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsPage({ onLogout, onDeleteCompleted }: { onLogout: () => void; onDeleteCompleted: () => void }) {
  const [profile, setProfile] = useState({ name: "Jordan Lee", email: "jordan@edgeboard.io", role: "Creative Director" });
  const [notifications, setNotifications] = useState({ email: true, push: false, digest: true, overdue: true });
  const [dangerConfirm, setDangerConfirm] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const inputCls: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 42, height: 24, borderRadius: 99, background: checked ? "rgba(0,255,163,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${checked ? "rgba(0,255,163,0.5)" : "rgba(255,255,255,0.12)"}`, position: "relative", cursor: "pointer", transition: "all 0.25s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#00ffa3" : "#64748b", position: "absolute", top: 3, left: checked ? 22 : 3, transition: "all 0.25s", boxShadow: checked ? "0 0 8px rgba(0,255,163,0.5)" : "none" }} />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <SpotlightCard className="p-6 mb-4" glowColor="#64748b">
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{title}</h3>
      {children}
    </SpotlightCard>
  );

  return (
    <div className="page-enter max-w-2xl">
      <div className="mb-8">
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Settings</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Manage your account, preferences, and workspace.</p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-6">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#0b0f19", flexShrink: 0 }}>JL</div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#fff", fontSize: 15 }}>{profile.name}</p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{profile.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: "Full Name", key: "name",  placeholder: "Your full name" },
            { label: "Email",     key: "email", placeholder: "you@agency.com" },
            { label: "Role",      key: "role",  placeholder: "Your role" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
              <input style={inputCls} placeholder={placeholder} value={(profile as Record<string, string>)[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
          style={{ fontFamily: "'DM Sans', sans-serif", background: saved ? "rgba(0,255,163,0.15)" : "linear-gradient(135deg, #00ffa3, #00cc82)", color: saved ? "#00ffa3" : "#0b0f19", border: saved ? "1px solid rgba(0,255,163,0.3)" : "none", boxShadow: saved ? "none" : "0 0 20px rgba(0,255,163,0.25)" }}>
          {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Changes"}
        </button>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        {[
          { key: "email",   label: "Email Notifications",  desc: "Receive task updates and alerts via email" },
          { key: "push",    label: "Push Notifications",   desc: "Browser push notifications for urgent tasks" },
          { key: "digest",  label: "Weekly Digest",        desc: "Summary email every Monday morning" },
          { key: "overdue", label: "Overdue Alerts",       desc: "Immediate alerts when tasks become overdue" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748b", marginTop: 1 }}>{desc}</p>
            </div>
            <Toggle checked={(notifications as Record<string, boolean>)[key]} onChange={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} />
          </div>
        ))}
      </Section>

      {/* Danger Zone */}
      <div style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 12, padding: 24 }}>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: "#f43f5e" }} />
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#f43f5e" }}>Danger Zone</h3>
        </div>
        {[
          { id: "completed", label: "Delete completed tasks", desc: "Permanently remove all completed tasks from the board.", action: onDeleteCompleted },
          { id: "logout",    label: "Sign out",               desc: "Sign out of EdgeBoard on this device.",                action: onLogout },
        ].map(({ id, label, desc, action }) => (
          <div key={id} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(244,63,94,0.1)" }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748b", marginTop: 1 }}>{desc}</p>
            </div>
            {dangerConfirm === id ? (
              <div className="flex gap-2">
                <button onClick={() => { action(); setDangerConfirm(null); }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(244,63,94,0.2)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>Confirm</button>
                <button onClick={() => setDangerConfirm(null)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setDangerConfirm(id)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer", letterSpacing: "0.05em" }}>
                {id === "logout" ? "Sign Out" : "Delete"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── System Specs ─────────────────────────────────────────────────────────────

function SystemSpecs() {
  const specs = [
    ["PRODUCT",    "EdgeBoard v1.0.0"],
    ["FRAMEWORK",  "React 18 + Vite"],
    ["STYLING",    "Tailwind CSS v4"],
    ["CHARTS",     "Recharts"],
    ["FONTS",      "Syne · Space Mono · DM Sans"],
    ["BG_PRIMARY", "#0B0F19 — Deep Space"],
    ["NEON_MINT",  "#00FFA3 — Primary Accent"],
    ["DIG_VIOLET", "#6E00FF — Secondary Accent"],
    ["CARDS",      "Glassmorphism · backdrop-blur(12px)"],
    ["BORDER",     "rgba(255,255,255,0.08)"],
    ["BUILD_DATE", "2026-06-28"],
  ];
  return (
    <div className="page-enter">
      <div className="mb-8">
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>System Specs</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Design tokens and technical configuration.</p>
      </div>
      <SpotlightCard glowColor="#6e00ff">
        {specs.map(([key, val]) => (
          <div key={key} className="flex items-center justify-between px-6 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.08em" }}>{key}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#cbd5e1" }}>{val}</span>
          </div>
        ))}
      </SpotlightCard>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
      style={{ background: active ? "rgba(0,255,163,0.1)" : "transparent", border: active ? "1px solid rgba(0,255,163,0.2)" : "1px solid transparent", color: active ? "#00ffa3" : "#64748b" }}>
      <Icon size={15} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
      {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#00ffa3", boxShadow: "0 0 6px #00ffa3" }} />}
    </button>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState<AppState>("login");
  const [page, setPage] = useState<AppPage>("board");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalTask, setModalTask] = useState<Task | "new" | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Check login session on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email");
    if (savedEmail) {
      setAppState("app");
    }
  }, []);

  // Load tasks on mount or appState change
  useEffect(() => {
    if (appState === "app") {
      const loadTasks = async () => {
        try {
          setLoading(true);
          const data = await taskService.getTasks();
          setTasks(data);
        } catch (err) {
          console.error("Failed to load tasks from DB:", err);
        } finally {
          setLoading(false);
        }
      };
      loadTasks();
    }
  }, [appState]);

  const handleGoogleLogin = useCallback((email: string, name: string) => {
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_name", name);
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    localStorage.setItem("user_initials", initials || "U");
    setAppState("app");
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_initials");
    setAppState("login");
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: Status) => {
    // Find task locally
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    // Log status update event
    const newActivity: ActivityEntry = {
      id: `ac${Date.now()}`,
      type: "status",
      user: "You",
      time: "just now",
      message: `Status updated to ${status.replace('-', ' ')}.`
    };
    const updatedActivity = [...(targetTask.activity || []), newActivity];

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, activity: updatedActivity } : t));
    setDrawerTask(prev => prev?.id === id ? { ...prev, status, activity: updatedActivity } : prev);

    try {
      await taskService.updateTask(id, { status, activity: updatedActivity });
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  }, [tasks]);

  const handleSaveTask = useCallback(async (task: Task) => {
    const exists = tasks.some(t => t.id === task.id);
    if (exists) {
      // Edit mode
      const newActivity: ActivityEntry = {
        id: `ac${Date.now()}`,
        type: "comment",
        user: "You",
        time: "just now",
        message: "Task details modified."
      };
      const updatedTask = { ...task, activity: [...task.activity, newActivity] };
      
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      
      try {
        await taskService.updateTask(task.id, updatedTask);
      } catch (err) {
        console.error("Failed to save edited task:", err);
      }
    } else {
      // Create mode
      try {
        // Remove temporary ID string
        const { id, ...newTaskData } = task;
        const created = await taskService.createTask(newTaskData);
        setTasks(prev => [created, ...prev]);
      } catch (err) {
        console.error("Failed to create task on server:", err);
      }
    }
  }, [tasks]);

  const handleDeleteCompleted = useCallback(async () => {
    const completedTasks = tasks.filter(t => t.status === "completed");
    
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t.status !== "completed"));
    
    try {
      await Promise.all(completedTasks.map(t => taskService.deleteTask(t.id)));
    } catch (err) {
      console.error("Failed to bulk delete completed tasks:", err);
    }
  }, [tasks]);

  const openEdit = (t: Task) => { setDrawerTask(null); setModalTask(t); };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <GridBackground />

      <div className="relative z-10 min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {appState === "login" && (
          <LoginPage onLogin={handleGoogleLogin} />
        )}
        {appState === "app" && (
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 flex flex-col h-full" style={{ background: "rgba(8,12,21,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "24px 20px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 14px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={13} style={{ color: "#0b0f19" }} />
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
                </div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#374151", textTransform: "uppercase", letterSpacing: "0.15em", marginLeft: 36 }}>Agency OS</p>
              </div>

              <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                <NavItem icon={LayoutGrid} label="Task Board"  active={page === "board"}     onClick={() => setPage("board")} />
                <NavItem icon={BarChart2}  label="Stats"       active={page === "stats"}     onClick={() => setPage("stats")} />
                <NavItem icon={PieChart}   label="Analytics"   active={page === "analytics"} onClick={() => setPage("analytics")} />
                <NavItem icon={Settings}   label="Settings"    active={page === "settings"}  onClick={() => setPage("settings")} />
                <NavItem icon={Cpu}        label="Sys Specs"   active={page === "specs"}     onClick={() => setPage("specs")} />
              </nav>

              <div style={{ padding: "12px 10px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#0b0f19", flexShrink: 0 }}>
                    {localStorage.getItem("user_initials") || "U"}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#cbd5e1", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {localStorage.getItem("user_name") || "User"}
                    </p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {localStorage.getItem("user_email") === "jordan@colledge.in" ? "Admin" : "Member"}
                    </p>
                  </div>
                  <button onClick={handleLogout} style={{ color: "#374151", background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Sign out">
                    <LogOut size={13} />
                  </button>
                </div>
                <p style={{ textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#1f2937", marginTop: 10, letterSpacing: "0.1em" }}>© 2026 EDGEBOARD</p>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto p-8">
              {loading && tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Spinner />
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#64748b" }}>Syncing with database...</p>
                </div>
              ) : (
                <>
                  {page === "board"     && <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} onOpenCreate={() => setModalTask("new")} onOpenEdit={openEdit} onOpenDetail={t => setDrawerTask(t)} />}
                  {page === "stats"     && <DashboardStats tasks={tasks} />}
                  {page === "analytics" && <AnalyticsPage tasks={tasks} />}
                  {page === "settings"  && <SettingsPage onLogout={handleLogout} onDeleteCompleted={handleDeleteCompleted} />}
                  {page === "specs"     && <SystemSpecs />}
                </>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalTask !== null && (
        <TaskModal
          initial={modalTask === "new" ? undefined : modalTask}
          onClose={() => setModalTask(null)}
          onSave={handleSaveTask}
        />
      )}

      {/* Task Details Drawer */}
      {drawerTask && (
        <TaskDrawer
          task={drawerTask}
          onClose={() => setDrawerTask(null)}
          onEdit={() => openEdit(drawerTask)}
          onStatusChange={(id, s) => { handleStatusChange(id, s); setDrawerTask(prev => prev ? { ...prev, status: s } : prev); }}
        />
      )}
    </>
  );
}

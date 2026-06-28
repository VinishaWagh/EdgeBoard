import { useState, useRef, useCallback, useEffect } from "react";
import {
  LayoutGrid, BarChart2, Cpu, Search, Plus, Play, CheckCircle, RotateCcw,
  X, AlertTriangle, Clock, ChevronDown, Zap, TrendingUp, ListChecks, Timer,
  Flame, Eye, EyeOff, Github, Chrome, ArrowRight, Settings, PieChart,
  User, Shield, MessageCircle, Activity, Tag, Calendar, Pencil,
  LogOut, RefreshCw, Star, Check, Menu, Layers, Globe, Lock,
  BookOpen, Dumbbell, DollarSign, Briefcase, Palette, Smile,
} from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "critical" | "high" | "medium" | "low";
type Status   = "pending" | "in-progress" | "completed" | "overdue";
type Category = "work" | "personal" | "health" | "learning" | "finance" | "creative";
type AppPage  = "board" | "stats" | "analytics" | "settings" | "specs";
type AppState = "landing" | "login" | "register" | "app";

interface ActivityEntry {
  id: string;
  type: "created" | "status" | "comment";
  time: string;
  message: string;
}

interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  dueDate: string;
  tags: string[];
  description: string;
  activity: ActivityEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  work:     { label: "Work",     icon: Briefcase, color: "#3b82f6" },
  personal: { label: "Personal", icon: Smile,     color: "#a78bfa" },
  health:   { label: "Health",   icon: Dumbbell,  color: "#f43f5e" },
  learning: { label: "Learning", icon: BookOpen,  color: "#f59e0b" },
  finance:  { label: "Finance",  icon: DollarSign,color: "#00ffa3" },
  creative: { label: "Creative", icon: Palette,   color: "#ec4899" },
};

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
    id: "t1", title: "Finish reading Atomic Habits", category: "learning",
    priority: "medium", status: "in-progress", dueDate: "2026-07-10",
    tags: ["books", "mindset"], description: "Currently on chapter 12. Goal is to finish and write a one-page summary of key takeaways.",
    activity: [
      { id: "a1", type: "created", time: "4 days ago",  message: "Task added." },
      { id: "a2", type: "status",  time: "2 days ago",  message: "Started reading — on chapter 8." },
      { id: "a3", type: "comment", time: "yesterday",   message: "Chapter 12 done. 3 more to go." },
    ],
  },
  {
    id: "t2", title: "Run 5km three times this week", category: "health",
    priority: "high", status: "in-progress", dueDate: "2026-06-30",
    tags: ["running", "fitness"], description: "Monday, Wednesday, Friday. Target pace: sub-30 minutes.",
    activity: [
      { id: "a4", type: "created", time: "6 days ago", message: "Task added." },
      { id: "a5", type: "comment", time: "3 days ago", message: "Monday run complete — 28:40." },
    ],
  },
  {
    id: "t3", title: "Complete React course — Module 4", category: "learning",
    priority: "high", status: "pending", dueDate: "2026-07-05",
    tags: ["react", "frontend"], description: "Hooks deep-dive and custom hook patterns. Take notes on useReducer vs useState trade-offs.",
    activity: [
      { id: "a6", type: "created", time: "2 days ago", message: "Task added." },
    ],
  },
  {
    id: "t4", title: "Pay quarterly estimated taxes", category: "finance",
    priority: "critical", status: "overdue", dueDate: "2026-06-15",
    tags: ["taxes", "deadline"], description: "Q2 estimated tax payment due. Log in to IRS EFTPS and submit.",
    activity: [
      { id: "a7", type: "created", time: "12 days ago", message: "Task added." },
      { id: "a8", type: "comment", time: "8 days ago",  message: "Reminder: missed Q1 last year — don't repeat." },
    ],
  },
  {
    id: "t5", title: "Plan Japan trip itinerary", category: "personal",
    priority: "medium", status: "pending", dueDate: "2026-08-01",
    tags: ["travel", "japan"], description: "Tokyo, Kyoto, Osaka. 14 days in September. Book flights and the first 3 nights of accommodation.",
    activity: [
      { id: "a9", type: "created", time: "1 week ago", message: "Task added." },
    ],
  },
  {
    id: "t6", title: "Build personal portfolio site", category: "creative",
    priority: "high", status: "pending", dueDate: "2026-07-20",
    tags: ["web", "design"], description: "Next.js + Tailwind. Showcase 5 projects. Write a concise bio. Dark theme, no frameworks UI kit.",
    activity: [
      { id: "a10", type: "created", time: "3 days ago", message: "Task added." },
    ],
  },
  {
    id: "t7", title: "Meal prep for the week", category: "health",
    priority: "low", status: "completed", dueDate: "2026-06-23",
    tags: ["nutrition", "routine"], description: "4 lunches, 4 dinners. Protein-forward. Batch cook rice, chicken, and roasted veggies.",
    activity: [
      { id: "a11", type: "created", time: "8 days ago", message: "Task added." },
      { id: "a12", type: "status",  time: "5 days ago", message: "Done — prepped Sunday afternoon." },
    ],
  },
  {
    id: "t8", title: "Review monthly budget — June", category: "finance",
    priority: "medium", status: "completed", dueDate: "2026-06-28",
    tags: ["budget", "review"], description: "Compare actuals vs plan. Flag overspends in dining and subscriptions.",
    activity: [
      { id: "a13", type: "created",  time: "5 days ago", message: "Task added." },
      { id: "a14", type: "status",   time: "1 day ago",  message: "Reviewed. Dining 18% over — noted for July." },
    ],
  },
  {
    id: "t9", title: "Write first blog post draft", category: "creative",
    priority: "medium", status: "in-progress", dueDate: "2026-07-07",
    tags: ["writing", "blog"], description: "Topic: 'What six months of daily coding taught me about consistency.' Target 1200 words.",
    activity: [
      { id: "a15", type: "created", time: "3 days ago", message: "Task added." },
      { id: "a16", type: "comment", time: "today",      message: "Outline done. Starting on the intro." },
    ],
  },
  {
    id: "t10", title: "Deep-clean and organise desk", category: "personal",
    priority: "low", status: "pending", dueDate: "2026-07-02",
    tags: ["home", "focus"], description: "Clear everything off, wipe down, cable management, and only put back what's needed.",
    activity: [
      { id: "a17", type: "created", time: "yesterday", message: "Task added." },
    ],
  },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Global Styles ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes shiny    { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeIn   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes ticker   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,163,0.3); }
  select option { background: #0f1526; color: #fff; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
  .drawer-open { animation: slideRight 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  .page-enter  { animation: fadeIn 0.25s ease forwards; }
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

function CategoryBadge({ category }: { category: Category }) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 6, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
      <Icon size={10} style={{ color: cfg.color }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{cfg.label}</span>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onGoRegister }: { onLogin: () => void; onGoRegister: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1400);
  };

  const inputStyle = (err: boolean): React.CSSProperties => ({
    width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${err ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10, color: "#fff", padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: "relative", zIndex: 10 }}>
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-10">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 20px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: "#0b0f19" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: 14 }}>Sign in to your personal dashboard</p>
        </div>

        <SpotlightCard className="p-8" glowColor="#00ffa3">
          <div className="flex gap-3 mb-6">
            {[{ icon: Chrome, label: "Google" }, { icon: Github, label: "GitHub" }].map(({ icon: Icon, label }) => (
              <button key={label} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif" }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input style={inputStyle(!!errors.email)} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              {errors.email && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{errors.email}</p>}
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inputStyle(!!errors.password), paddingRight: 44 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{errors.password}</p>}
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-70"
              style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 24px rgba(0,255,163,0.3)" }}>
              {loading ? <><Spinner />Signing in…</> : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </div>
        </SpotlightCard>

        <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 20 }}>
          No account? <button onClick={onGoRegister} style={{ color: "#00ffa3", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Create one →</button>
        </p>
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
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!form.terms) e.terms = "You must accept the terms";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegister(); }, 1600);
  };

  const inputStyle = (err: boolean): React.CSSProperties => ({
    width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${err ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10, color: "#fff", padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: "relative", zIndex: 10 }}>
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 20px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: "#0b0f19" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: 14 }}>Your personal command centre starts here</p>
        </div>

        <SpotlightCard className="p-8" glowColor="#6e00ff">
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Your Name</label>
              <input style={inputStyle(!!errors.name)} placeholder="Alex Rivera" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input style={inputStyle(!!errors.email)} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle(!!errors.password), paddingRight: 40 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {errors.password && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.password}</p>}
              </div>
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Confirm</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle(!!errors.confirm), paddingRight: 40 }} type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                  <button onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>{showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {errors.confirm && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.confirm}</p>}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <div onClick={() => setForm({ ...form, terms: !form.terms })}
                style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${form.terms ? "#00ffa3" : errors.terms ? "#f43f5e" : "rgba(255,255,255,0.2)"}`, background: form.terms ? "rgba(0,255,163,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0, transition: "all 0.2s" }}>
                {form.terms && <CheckCircle size={11} style={{ color: "#00ffa3" }} />}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                I agree to the <span style={{ color: "#00ffa3" }}>Terms of Service</span> and <span style={{ color: "#00ffa3" }}>Privacy Policy</span>
              </span>
            </label>
            {errors.terms && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: -8 }}>{errors.terms}</p>}
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-70"
              style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 24px rgba(0,255,163,0.3)", marginTop: 4 }}>
              {loading ? <><Spinner />Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </div>
        </SpotlightCard>

        <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 20 }}>
          Already have an account? <button onClick={onGoLogin} style={{ color: "#00ffa3", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Sign in →</button>
        </p>
      </div>
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({ initial, onClose, onSave }: { initial?: Task; onClose: () => void; onSave: (t: Task) => void }) {
  const [form, setForm] = useState({
    title:       initial?.title ?? "",
    category:    (initial?.category ?? "personal") as Category,
    description: initial?.description ?? "",
    priority:    (initial?.priority ?? "medium") as Priority,
    status:      (initial?.status ?? "pending") as Status,
    dueDate:     initial?.dueDate ?? "",
    tags:        initial?.tags.join(", ") ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      id: initial?.id ?? `t${Date.now()}`,
      title: form.title, category: form.category, description: form.description,
      priority: form.priority, status: form.status, dueDate: form.dueDate,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      activity: initial?.activity ?? [{ id: `ac${Date.now()}`, type: "created", time: "just now", message: "Task added." }],
    });
    onClose();
  };

  const inputCls: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl p-7 page-enter" style={{ background: "rgba(12,18,34,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", boxShadow: "0 0 60px rgba(0,255,163,0.07), 0 40px 80px rgba(0,0,0,0.7)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{initial ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} style={{ color: "#64748b" }} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Title *</label>
            <input style={{ ...inputCls, borderColor: errors.title ? "#f43f5e" : "rgba(255,255,255,0.1)" }} placeholder="What do you need to do?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            {errors.title && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const sel = form.category === cat;
                return (
                  <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: sel ? `${cfg.color}18` : "rgba(255,255,255,0.04)", border: `1.5px solid ${sel ? cfg.color + "60" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                    <Icon size={12} style={{ color: sel ? cfg.color : "#64748b" }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: sel ? "#fff" : "#64748b" }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Priority</label>
              <div style={{ position: "relative" }}>
                <select style={{ ...inputCls, appearance: "none", paddingRight: 32, cursor: "pointer" } as React.CSSProperties} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                  {(["critical","high","medium","low"] as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Due Date *</label>
              <input type="date" style={{ ...inputCls, colorScheme: "dark", borderColor: errors.dueDate ? "#f43f5e" : "rgba(255,255,255,0.1)" }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              {errors.dueDate && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.dueDate}</p>}
            </div>
          </div>

          {initial && (
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Status</label>
              <div style={{ position: "relative" }}>
                <select style={{ ...inputCls, appearance: "none", paddingRight: 32, cursor: "pointer" } as React.CSSProperties} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                  {(["pending","in-progress","completed","overdue"] as Status[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Notes</label>
            <textarea style={{ ...inputCls, resize: "vertical", minHeight: 72, lineHeight: 1.6 }} placeholder="Any details, context, or reminders…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Tags (comma-separated)</label>
            <input style={inputCls} placeholder="e.g. reading, fitness, goals" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 20px rgba(0,255,163,0.25)" }}>
            {initial ? "Save Changes" : "Add Task"}
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

// ─── Task Drawer ──────────────────────────────────────────────────────────────

function TaskDrawer({ task, onClose, onEdit, onStatusChange }: { task: Task; onClose: () => void; onEdit: () => void; onStatusChange: (id: string, s: Status) => void }) {
  const p = PRIORITY_CONFIG[task.priority];
  const s = STATUS_CONFIG[task.status];
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="drawer-open w-full max-w-md h-full flex flex-col"
        style={{ background: "rgba(10,15,28,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CategoryBadge category={task.category} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: p.color, background: p.bg, padding: "2px 7px", borderRadius: 4 }}>{p.label}</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1.4 }}>{task.title}</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Pencil size={12} style={{ color: "#00ffa3" }} />
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={13} style={{ color: "#64748b" }} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: Calendar, label: "Due Date", value: formatDate(task.dueDate) },
              { icon: Tag,      label: "Tags",     value: task.tags.length ? task.tags.map(t => `#${t}`).join(" ") : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><Icon size={10} style={{ color: "#64748b" }} /><span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span></div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" }}>{value}</p>
              </div>
            ))}
          </div>

          {task.description && (
            <div>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Notes</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{task.description}</p>
            </div>
          )}

          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Status</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["pending","in-progress","completed","overdue"] as Status[]).map(st => {
                const cfg = STATUS_CONFIG[st];
                const active = task.status === st;
                return (
                  <button key={st} onClick={() => onStatusChange(task.id, st)}
                    style={{ padding: "6px 12px", borderRadius: 8, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", background: active ? `${cfg.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? cfg.color + "50" : "rgba(255,255,255,0.08)"}`, color: active ? cfg.color : "#64748b", cursor: "pointer", transition: "all 0.15s" }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Activity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {task.activity.map(entry => (
                <div key={entry.id} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#00ffa3", marginTop: 2 }}>
                    {entry.type === "created" ? <Plus size={10} /> : entry.type === "status" ? <RefreshCw size={10} /> : <MessageCircle size={10} />}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" }}>{entry.message}</p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", marginTop: 2 }}>{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note…"
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
  const isActive  = task.status === "in-progress";
  const isOverdue = task.status === "overdue";

  return (
    <div className="relative rounded-xl overflow-hidden group" style={{ backdropFilter: "blur(12px)" }}>
      {isActive && <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: "linear-gradient(#0b0f19, #0b0f19) padding-box, linear-gradient(90deg, #00ffa3, #6e00ff, #00ffa3) border-box", border: "1px solid transparent" }} />}
      <div className="relative p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <h3 className="cursor-pointer hover:text-[#00ffa3] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#fff", lineHeight: 1.4, flex: 1 }} onClick={onOpen}>{task.title}</h3>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Pencil size={10} style={{ color: "#64748b" }} />
            </button>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: p.color, background: p.bg, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.08em" }}>{p.label}</span>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <CategoryBadge category={task.category} />
        </div>

        {task.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {task.tags.map(tag => (
              <span key={tag} style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>#{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={10} style={{ color: isOverdue ? "#f43f5e" : "#64748b" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isOverdue ? "#f43f5e" : "#64748b" }}>{formatDate(task.dueDate)}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: s.color, marginLeft: 4, letterSpacing: "0.06em" }}>{s.label}</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {task.status !== "in-progress" && task.status !== "completed" && (
              <button onClick={() => onStatusChange(task.id, "in-progress")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)" }}>
                <Play size={10} style={{ color: "#00ffa3" }} />
              </button>
            )}
            {task.status !== "completed" && (
              <button onClick={() => onStatusChange(task.id, "completed")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)" }}>
                <CheckCircle size={10} style={{ color: "#00ffa3" }} />
              </button>
            )}
            {task.status === "completed" && (
              <button onClick={() => onStatusChange(task.id, "pending")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)" }}>
                <RotateCcw size={10} style={{ color: "#64748b" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty / No Results ───────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, body, action, onAction }: { icon: React.ElementType; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Search size={26} style={{ color: "#374151" }} />
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 6 }}>Nothing matches</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b", maxWidth: 260, lineHeight: 1.6, marginBottom: 20 }}>Try different keywords or clear your filters to see all tasks.</p>
      <button onClick={onClear} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.2)", color: "#00ffa3", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
        <X size={14} /> Clear filters
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
  const [filterStatus,   setFilterStatus]   = useState<Status | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<"dueDate" | "priority" | "status">("dueDate");

  const prioOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statOrder: Record<Status,   number> = { overdue: 0, "in-progress": 1, pending: 2, completed: 3 };

  const filtered = tasks
    .filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus   !== "all" && t.status   !== filterStatus)   return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => sort === "dueDate" ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : sort === "priority" ? prioOrder[a.priority] - prioOrder[b.priority] : statOrder[a.status] - statOrder[b.status]);

  const selStyle: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#cbd5e1", padding: "8px 28px 8px 10px", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: "0.04em", appearance: "none", cursor: "pointer", outline: "none" };

  return (
    <div className="page-enter">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>My Tasks</h1></ShinyText>
          <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Everything on your plate, all in one place.</p>
        </div>
        <button onClick={onOpenCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shrink-0 transition-all duration-200 hover:scale-[1.03]"
          style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 24px rgba(0,255,163,0.3)" }}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
          <input style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "9px 14px 9px 34px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" }}
            placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { val: filterCategory, set: setFilterCategory, opts: [["all","All Categories"], ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => [k, v.label])] },
          { val: filterStatus,   set: setFilterStatus,   opts: [["all","All Status"],["pending","Pending"],["in-progress","In Progress"],["completed","Completed"],["overdue","Overdue"]] },
          { val: filterPriority, set: setFilterPriority, opts: [["all","All Priority"],["critical","Critical"],["high","High"],["medium","Medium"],["low","Low"]] },
          { val: sort,           set: setSort,           opts: [["dueDate","Due Date"],["priority","Priority"],["status","Status"]].map(([v, l]) => [v, `Sort: ${l}`]) },
        ].map(({ val, set, opts }, i) => (
          <div key={i} style={{ position: "relative" }}>
            <select style={selStyle} value={val} onChange={e => (set as (v: string) => void)(e.target.value)}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
          </div>
        ))}
      </div>

      {tasks.length === 0
        ? <EmptyState icon={LayoutGrid} title="No tasks yet" body="Add your first task and start tracking everything that matters to you." action="Add Task" onAction={onOpenCreate} />
        : filtered.length === 0
          ? <NoResults onClear={() => { setSearch(""); setFilterStatus("all"); setFilterCategory("all"); setFilterPriority("all"); }} />
          : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(t => <TaskCard key={t.id} task={t} onStatusChange={onStatusChange} onOpen={() => onOpenDetail(t)} onEdit={() => onOpenEdit(t)} />)}
            </div>
      }
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, glowColor }: { icon: React.ElementType; label: string; value: number; color: string; glowColor: string }) {
  return (
    <SpotlightCard className="p-5" glowColor={glowColor}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
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
  const total   = tasks.length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProg  = tasks.filter(t => t.status === "in-progress").length;
  const done    = tasks.filter(t => t.status === "completed").length;
  const over    = tasks.filter(t => t.status === "overdue").length;

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Overview</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>A snapshot of where everything stands.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={ListChecks}  label="Total"       value={total}   color="#cbd5e1" glowColor="#cbd5e1" />
        <StatCard icon={Timer}       label="Pending"     value={pending} color="#3b82f6" glowColor="#3b82f6" />
        <StatCard icon={Zap}         label="Active"      value={inProg}  color="#00ffa3" glowColor="#00ffa3" />
        <StatCard icon={CheckCircle} label="Done"        value={done}    color="#00ffa3" glowColor="#00ffa3" />
        <StatCard icon={Flame}       label="Overdue"     value={over}    color="#f43f5e" glowColor="#f43f5e" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "By Category", glow: "#00ffa3", items: (Object.keys(CATEGORY_CONFIG) as Category[]).map(c => ({ label: CATEGORY_CONFIG[c].label, count: tasks.filter(t => t.category === c).length, color: CATEGORY_CONFIG[c].color })) },
          { title: "By Priority", glow: "#6e00ff", items: (["critical","high","medium","low"] as Priority[]).map(p => ({ label: PRIORITY_CONFIG[p].label, count: tasks.filter(t => t.priority === p).length, color: PRIORITY_CONFIG[p].color })) },
        ].map(({ title, glow, items }) => (
          <SpotlightCard key={title} className="p-6" glowColor={glow}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>{title}</h3>
            {items.map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
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

const TT_STYLE: React.CSSProperties = { background: "rgba(10,15,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" };

function AnalyticsPage({ tasks }: { tasks: Task[] }) {
  const statusData = [
    { name: "Pending",     value: tasks.filter(t => t.status === "pending").length,     color: "#3b82f6" },
    { name: "Active",      value: tasks.filter(t => t.status === "in-progress").length, color: "#00ffa3" },
    { name: "Completed",   value: tasks.filter(t => t.status === "completed").length,   color: "#6e00ff" },
    { name: "Overdue",     value: tasks.filter(t => t.status === "overdue").length,     color: "#f43f5e" },
  ].filter(d => d.value > 0);

  const catData = (Object.keys(CATEGORY_CONFIG) as Category[]).map(c => ({
    name: CATEGORY_CONFIG[c].label,
    Total: tasks.filter(t => t.category === c).length,
    Done:  tasks.filter(t => t.category === c && t.status === "completed").length,
  })).filter(d => d.Total > 0);

  const weeklyData = [
    { week: "W21", added: 2, done: 1 },
    { week: "W22", added: 3, done: 2 },
    { week: "W23", added: 1, done: 2 },
    { week: "W24", added: 5, done: 3 },
    { week: "W25", added: 4, done: 2 },
    { week: "W26", added: 3, done: 3 },
    { week: "W27", added: tasks.length, done: tasks.filter(t => t.status === "completed").length },
  ];

  const trendData = [
    { date: "Jun 1",  active: 3, completed: 1 },
    { date: "Jun 8",  active: 4, completed: 2 },
    { date: "Jun 15", active: 5, completed: 4 },
    { date: "Jun 22", active: 6, completed: 5 },
    { date: "Jun 29", active: tasks.filter(t => t.status === "in-progress").length, completed: tasks.filter(t => t.status === "completed").length },
  ];

  const recentActivity = tasks.flatMap(t => t.activity.map(a => ({ ...a, taskTitle: t.title }))).slice(0, 8);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Analytics</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Patterns and progress across all your work.</p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={BarChart2} title="Nothing to analyse yet" body="Add some tasks and start tracking them to see your personal productivity insights here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpotlightCard className="p-6" glowColor="#00ffa3">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Task Status Split</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} />
                <Legend formatter={v => <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#cbd5e1" }}>{v}</span>} />
              </RechartsPie>
            </ResponsiveContainer>
          </SpotlightCard>

          <SpotlightCard className="p-6" glowColor="#6e00ff">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Tasks by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="Total" fill="#6e00ff" opacity={0.7} radius={[4,4,0,0]} />
                <Bar dataKey="Done"  fill="#00ffa3" opacity={0.85} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          <SpotlightCard className="p-6" glowColor="#3b82f6">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Weekly Rhythm</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="added" fill="#3b82f6" opacity={0.6} radius={[4,4,0,0]} name="Added" />
                <Bar dataKey="done"  fill="#00ffa3" opacity={0.85} radius={[4,4,0,0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          <SpotlightCard className="p-6" glowColor="#f59e0b">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Momentum Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ffa3" stopOpacity={0.3} /><stop offset="95%" stopColor="#00ffa3" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6e00ff" stopOpacity={0.25} /><stop offset="95%" stopColor="#6e00ff" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Area type="monotone" dataKey="active"    stroke="#00ffa3" fill="url(#gAct)"  strokeWidth={2} name="Active"    dot={false} />
                <Area type="monotone" dataKey="completed" stroke="#6e00ff" fill="url(#gDone)" strokeWidth={2} name="Completed" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </SpotlightCard>

          <SpotlightCard className="p-6 lg:col-span-2" glowColor="#64748b">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16 }}>Recent Activity</h3>
            {recentActivity.length === 0
              ? <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b" }}>No activity yet.</p>
              : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentActivity.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#00ffa3" }}>
                        <Activity size={10} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#cbd5e1" }}>{e.message}</p>
                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", marginTop: 2 }}>{e.taskTitle} · {e.time}</p>
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
  const [profile, setProfile] = useState({ name: "Alex Rivera", email: "alex@example.com", bio: "Building things, learning constantly." });
  const [notifs,  setNotifs]  = useState({ email: true, push: false, digest: true, overdue: true });
  const [dangerTarget, setDangerTarget] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const inputCls: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 42, height: 24, borderRadius: 99, background: on ? "rgba(0,255,163,0.2)" : "rgba(255,255,255,0.08)", border: `1px solid ${on ? "rgba(0,255,163,0.5)" : "rgba(255,255,255,0.12)"}`, position: "relative", cursor: "pointer", flexShrink: 0, transition: "all 0.25s" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: on ? "#00ffa3" : "#64748b", position: "absolute", top: 3, left: on ? 22 : 3, transition: "all 0.25s", boxShadow: on ? "0 0 8px rgba(0,255,163,0.5)" : "none" }} />
    </button>
  );

  return (
    <div className="page-enter" style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Settings</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Manage your profile and preferences.</p>
      </div>

      {/* Profile */}
      <SpotlightCard className="p-6 mb-4" glowColor="#00ffa3">
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Profile</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#0b0f19", flexShrink: 0 }}>
            {profile.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#fff", fontSize: 15 }}>{profile.name}</p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Personal Account</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Display Name", key: "name",  placeholder: "Your name" },
            { label: "Email",        key: "email", placeholder: "you@example.com" },
            { label: "Short Bio",    key: "bio",   placeholder: "A line about you" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
              <input style={inputCls} placeholder={placeholder} value={(profile as Record<string, string>)[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, padding: "9px 18px", borderRadius: 10, background: saved ? "rgba(0,255,163,0.12)" : "linear-gradient(135deg, #00ffa3, #00cc82)", color: saved ? "#00ffa3" : "#0b0f19", border: saved ? "1px solid rgba(0,255,163,0.3)" : "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, boxShadow: saved ? "none" : "0 0 20px rgba(0,255,163,0.25)", transition: "all 0.2s" }}>
          {saved ? <><CheckCircle size={14} />Saved!</> : "Save Changes"}
        </button>
      </SpotlightCard>

      {/* Notifications */}
      <SpotlightCard className="p-6 mb-4" glowColor="#6e00ff">
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Notifications</h3>
        {[
          { key: "email",   label: "Email reminders",  desc: "Get task updates sent to your email" },
          { key: "push",    label: "Push notifications", desc: "Browser notifications for urgent items" },
          { key: "digest",  label: "Weekly summary",    desc: "A roundup every Monday morning" },
          { key: "overdue", label: "Overdue alerts",    desc: "Instant alert when a task passes its due date" },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748b", marginTop: 2 }}>{desc}</p>
            </div>
            <Toggle on={(notifs as Record<string, boolean>)[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} />
          </div>
        ))}
      </SpotlightCard>

      {/* Danger zone */}
      <div style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Shield size={15} style={{ color: "#f43f5e" }} />
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#f43f5e" }}>Danger Zone</h3>
        </div>
        {[
          { id: "completed", label: "Clear completed tasks", desc: "Permanently delete all tasks you've marked done.",  action: onDeleteCompleted },
          { id: "logout",    label: "Sign out",              desc: "Sign out of EdgeBoard on this device.",             action: onLogout },
        ].map(({ id, label, desc, action }) => (
          <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(244,63,94,0.1)", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748b", marginTop: 1 }}>{desc}</p>
            </div>
            {dangerTarget === id ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { action(); setDangerTarget(null); }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(244,63,94,0.2)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>Confirm</button>
                <button onClick={() => setDangerTarget(null)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setDangerTarget(id)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer", letterSpacing: "0.05em" }}>
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
  const rows = [
    ["PRODUCT",   "EdgeBoard v1.0.0 — Personal"],
    ["FRAMEWORK", "React 18 + Vite"],
    ["STYLING",   "Tailwind CSS v4"],
    ["CHARTS",    "Recharts"],
    ["FONTS",     "Syne · Space Mono · DM Sans"],
    ["BG",        "#0B0F19 — Deep Space"],
    ["ACCENT_1",  "#00FFA3 — Neon Mint"],
    ["ACCENT_2",  "#6E00FF — Digital Violet"],
    ["CARDS",     "Glassmorphism · blur(12px)"],
    ["BUILD",     "2026-06-28"],
  ];
  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>System</h1></ShinyText>
        <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Technical config and design tokens.</p>
      </div>
      <SpotlightCard glowColor="#6e00ff">
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.08em" }}>{k}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#cbd5e1" }}>{v}</span>
          </div>
        ))}
      </SpotlightCard>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: active ? "rgba(0,255,163,0.1)" : "transparent", border: active ? "1px solid rgba(0,255,163,0.2)" : "1px solid transparent", color: active ? "#00ffa3" : "#64748b", cursor: "pointer", transition: "all 0.2s" }}>
      <Icon size={15} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
      {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#00ffa3", boxShadow: "0 0 6px #00ffa3" }} />}
    </button>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: LayoutGrid, title: "Task board",        body: "See everything at once. Colour-coded by category and priority, sortable and filterable in real-time.", color: "#00ffa3" },
  { icon: Tag,        title: "Six categories",    body: "Work, Personal, Health, Learning, Finance, Creative — organise every area of your life in one place.", color: "#a78bfa" },
  { icon: BarChart2,  title: "Personal analytics",body: "Charts that show your weekly rhythm, completion rate, and which areas of life get the most attention.", color: "#6e00ff" },
  { icon: Activity,   title: "Activity log",      body: "Every note, status change, and update on each task — a full personal record of your progress over time.", color: "#f59e0b" },
  { icon: Search,     title: "Smart filtering",   body: "Find any task instantly. Filter by category, status, priority, or type any keyword to narrow things down.", color: "#3b82f6" },
  { icon: Shield,     title: "Yours only",        body: "No team accounts, no shared workspaces. EdgeBoard is built entirely around one person: you.", color: "#f43f5e" },
];

const TESTIMONIALS = [
  { quote: "I've tried every productivity app out there. EdgeBoard is the only one that didn't feel like work to use.", name: "Mia Johansson", role: "Freelance Designer", color: "#00ffa3" },
  { quote: "The categories are exactly what I needed. I can finally separate my side project from my gym goals from my finances.", name: "Darius Osei",    role: "Software Engineer", color: "#6e00ff" },
  { quote: "Dark, fast, and actually beautiful. I genuinely look forward to opening it every morning.", name: "Sasha Kuznetsova", role: "PhD Researcher", color: "#3b82f6" },
];

const PRICING = [
  { tier: "Free", price: "Free", period: "", desc: "For anyone who just wants to get started.", features: ["Unlimited tasks", "All 6 categories", "Basic analytics", "Activity log"], cta: "Start free", accent: "#64748b", highlight: false },
  { tier: "Pro",  price: "$6",   period: "/mo", desc: "For people who are serious about their productivity.", features: ["Everything in Free", "Full analytics suite", "Recurring tasks", "Priority support", "Dark + light themes"], cta: "Start 14-day trial", accent: "#00ffa3", highlight: true },
];

function DashboardMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ position: "absolute", inset: -40, background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,255,163,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,163,0.08)", position: "relative" }}>
        <div style={{ background: "rgba(8,12,21,0.97)", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 6 }}>
          {["#f43f5e","#f59e0b","#00ffa3"].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
          <div style={{ flex: 1, margin: "0 12px", height: 16, borderRadius: 4, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#374151" }}>edgeboard.io/board</span>
          </div>
        </div>
        <div style={{ background: "rgba(11,15,25,0.97)", display: "flex", minHeight: 300 }}>
          <div style={{ width: 110, background: "rgba(8,12,21,0.8)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "14px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={7} style={{ color: "#0b0f19" }} /></div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 9, background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
            </div>
            {[{ icon: LayoutGrid, l: "My Tasks", a: true }, { icon: BarChart2, l: "Overview", a: false }, { icon: PieChart, l: "Analytics", a: false }].map(({ icon: I, l, a }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 6, background: a ? "rgba(0,255,163,0.1)" : "transparent", border: a ? "1px solid rgba(0,255,163,0.2)" : "1px solid transparent" }}>
                <I size={8} style={{ color: a ? "#00ffa3" : "#374151" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: a ? "#00ffa3" : "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 12, color: "#fff" }}>My Tasks</span>
              <div style={{ padding: "3px 9px", borderRadius: 6, background: "linear-gradient(135deg, #00ffa3, #00cc82)", display: "flex", alignItems: "center", gap: 3 }}>
                <Plus size={7} style={{ color: "#0b0f19" }} /><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 700, color: "#0b0f19" }}>Add Task</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["10","TOTAL","#cbd5e1"],["4","ACTIVE","#00ffa3"],["1","OVERDUE","#f43f5e"]].map(([v, l, c]) => (
                <div key={l} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "7px 8px" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            {[
              { title: "5km run this week",       cat: "HEALTH",   catColor: "#f43f5e", tag: "HIGH",   tagColor: "#f59e0b", border: true },
              { title: "Finish React Module 4",   cat: "LEARNING", catColor: "#f59e0b", tag: "HIGH",   tagColor: "#f59e0b", border: false },
              { title: "Review monthly budget",   cat: "FINANCE",  catColor: "#00ffa3", tag: "MEDIUM", tagColor: "#3b82f6", border: false },
            ].map((t, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: t.border ? "1px solid transparent" : "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "8px 10px", marginBottom: 6, backgroundImage: t.border ? "linear-gradient(rgba(11,15,25,0.95), rgba(11,15,25,0.95)), linear-gradient(90deg, #00ffa3, #6e00ff)" : undefined, backgroundClip: t.border ? "padding-box, border-box" : undefined, backgroundOrigin: t.border ? "border-box" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, color: "#fff" }}>{t.title}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: t.tagColor, background: `${t.tagColor}18`, padding: "1px 5px", borderRadius: 3 }}>{t.tag}</span>
                </div>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: t.catColor, background: `${t.catColor}15`, padding: "1px 5px", borderRadius: 3 }}>{t.cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: -14, right: -18, background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.25)", borderRadius: 9, padding: "6px 11px", backdropFilter: "blur(12px)" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#00ffa3" }}>4 TASKS DUE THIS WEEK</span>
      </div>
      <div style={{ position: "absolute", bottom: 28, left: -22, background: "rgba(110,0,255,0.1)", border: "1px solid rgba(110,0,255,0.25)", borderRadius: 9, padding: "6px 11px", backdropFilter: "blur(12px)" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#a78bfa" }}>↑ 60% DONE</span>
      </div>
    </div>
  );
}

function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("landing-scroll");
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", h);
    return () => el.removeEventListener("scroll", h);
  }, []);

  const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
  const syne: React.CSSProperties = { fontFamily: "'Syne', sans-serif" };
  const dm:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

  return (
    <div id="landing-scroll" className="h-screen overflow-y-auto" style={{ position: "relative", zIndex: 10 }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: scrolled ? "rgba(8,12,21,0.92)" : "transparent", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent", backdropFilter: scrolled ? "blur(20px)" : "none", transition: "all 0.3s", padding: "0 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 14px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={13} style={{ color: "#0b0f19" }} /></div>
            <span style={{ ...syne, fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features","How it works","Pricing"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} style={{ ...mono, fontSize: 9, color: "#64748b", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.12em", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color="#cbd5e1")} onMouseLeave={e => (e.currentTarget.style.color="#64748b")}>{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin} style={{ ...dm, fontSize: 13, fontWeight: 600, color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", padding: "8px 14px" }}>Sign in</button>
            <button onClick={onRegister} style={{ ...dm, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", boxShadow: "0 0 20px rgba(0,255,163,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
              Get started <ArrowRight size={13} />
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(v => !v)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: "rgba(8,12,21,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 40px 20px" }}>
            {["Features","How it works","Pricing"].map(l => <div key={l} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><span style={{ ...mono, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>{l}</span></div>)}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <button onClick={onLogin} style={{ ...dm, fontSize: 14, fontWeight: 600, color: "#cbd5e1", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px", cursor: "pointer" }}>Sign in</button>
              <button onClick={onRegister} style={{ ...dm, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", border: "none", borderRadius: 8, padding: "12px", cursor: "pointer" }}>Get started free</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px 100px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(0,255,163,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 200, left: "5%", width: 280, height: 280, background: "radial-gradient(ellipse, rgba(110,0,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.2)", borderRadius: 99, padding: "6px 14px", marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffa3", boxShadow: "0 0 8px #00ffa3" }} />
          <span style={{ ...mono, fontSize: 9, color: "#00ffa3", letterSpacing: "0.12em", textTransform: "uppercase" }}>Personal task manager · v1.0</span>
        </div>

        <h1 style={{ ...syne, fontWeight: 800, fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1.05, letterSpacing: "-2px", color: "#fff", marginBottom: 22, maxWidth: 760, margin: "0 auto 22px" }}>
          One place for<br /><ShinyText>everything you're working on.</ShinyText>
        </h1>

        <p style={{ ...dm, fontSize: "clamp(14px, 2vw, 17px)", color: "#64748b", lineHeight: 1.75, maxWidth: 480, margin: "0 auto 36px" }}>
          Tasks across work, health, learning, finances, and life — all in a single dark, fast, beautifully minimal board built for one person: you.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <button onClick={onRegister} style={{ ...dm, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", border: "none", borderRadius: 10, padding: "13px 26px", cursor: "pointer", boxShadow: "0 0 30px rgba(0,255,163,0.35)", display: "flex", alignItems: "center", gap: 7, transition: "transform 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.transform="scale(1.03)")} onMouseLeave={e => (e.currentTarget.style.transform="scale(1)")}>
            Start for free <ArrowRight size={15} />
          </button>
          <button onClick={onLogin} style={{ ...dm, fontSize: 15, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "13px 26px", cursor: "pointer" }}>Sign in</button>
        </div>
        <p style={{ ...mono, fontSize: 9, color: "#374151", letterSpacing: "0.1em" }}>FREE FOREVER PLAN · NO CREDIT CARD NEEDED</p>

        <div style={{ marginTop: 60 }}>
          <DashboardMockup />
        </div>
      </section>

      {/* Ticker */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 0", overflow: "hidden", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 60, whiteSpace: "nowrap", animation: "ticker 18s linear infinite" }}>
          {["WORK", "PERSONAL", "HEALTH", "LEARNING", "FINANCE", "CREATIVE", "GOALS", "HABITS", "PROJECTS", "FOCUS", "WORK", "PERSONAL", "HEALTH", "LEARNING", "FINANCE", "CREATIVE", "GOALS", "HABITS"].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(0,255,163,0.4)" }} />
              <span style={{ ...mono, fontSize: 10, color: "#374151", letterSpacing: "0.2em" }}>{w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(110,0,255,0.1)", border: "1px solid rgba(110,0,255,0.25)", borderRadius: 99, padding: "5px 12px", marginBottom: 14 }}>
            <Layers size={10} style={{ color: "#a78bfa" }} />
            <span style={{ ...mono, fontSize: 9, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase" }}>Everything you need</span>
          </div>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 4vw, 42px)", letterSpacing: "-1.5px", color: "#fff", marginBottom: 12 }}>Built around your life, not a team</h2>
          <p style={{ ...dm, fontSize: 14, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>No shared workspaces, no client management, no bloat. Just a clean, personal space to stay on top of things.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {FEATURES.map(({ icon: Icon, title, body, color }) => (
            <SpotlightCard key={title} className="p-6" glowColor={color}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon size={16} style={{ color }} />
              </div>
              <h3 style={{ ...syne, fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 7 }}>{title}</h3>
              <p style={{ ...dm, fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{body}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div style={{ background: "rgba(0,255,163,0.03)", borderTop: "1px solid rgba(0,255,163,0.08)", borderBottom: "1px solid rgba(0,255,163,0.08)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 40, textAlign: "center" }}>
          {[["50k+","Tasks completed"],["20k+","People using EdgeBoard"],["6","Life categories"],["Free","Always free tier"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ ...syne, fontWeight: 800, fontSize: 38, color: "#00ffa3", lineHeight: 1, textShadow: "0 0 24px rgba(0,255,163,0.3)", marginBottom: 7 }}>{n}</div>
              <div style={{ ...dm, fontSize: 13, color: "#64748b" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 4vw, 42px)", letterSpacing: "-1.5px", color: "#fff", marginBottom: 12 }}>Simple by design</h2>
          <p style={{ ...dm, fontSize: 14, color: "#64748b", maxWidth: 400, margin: "0 auto" }}>Open EdgeBoard, add your tasks, and start moving.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, position: "relative" }}>
          <div className="hidden lg:block" style={{ position: "absolute", top: 40, left: "16.67%", right: "16.67%", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,163,0.2) 20%, rgba(0,255,163,0.2) 80%, transparent)" }} />
          {[
            { n: "01", title: "Add your tasks",       body: "Create tasks for anything — a workout, a book, a work deadline. Pick a category, set a due date, and add any notes you need." },
            { n: "02", title: "Organise by category",  body: "Work tasks live separately from your health goals and finance to-dos. Filter or view them all together — your call." },
            { n: "03", title: "Track and finish",      body: "Move tasks from pending to done, monitor your momentum in analytics, and build the habit of consistently following through." },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,255,163,0.07)", border: "1px solid rgba(0,255,163,0.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 0 20px rgba(0,255,163,0.08)" }}>
                <span style={{ ...syne, fontWeight: 800, fontSize: 17, color: "#00ffa3" }}>{n}</span>
              </div>
              <h3 style={{ ...syne, fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 9 }}>{title}</h3>
              <p style={{ ...dm, fontSize: 13, color: "#64748b", lineHeight: 1.65, maxWidth: 240, margin: "0 auto" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 90px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "-1.5px", color: "#fff", marginBottom: 10 }}>People love it</h2>
          <p style={{ ...dm, fontSize: 14, color: "#64748b" }}>From freelancers to students to developers — real people, real results.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {TESTIMONIALS.map(({ quote, name, role, color }) => (
            <SpotlightCard key={name} className="p-6" glowColor={color}>
              <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={color} style={{ color }} />)}
              </div>
              <p style={{ ...dm, fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, marginBottom: 18 }}>"{quote}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", ...syne, fontWeight: 800, fontSize: 11, color }}>
                  {name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p style={{ ...dm, fontSize: 13, fontWeight: 600, color: "#fff" }}>{name}</p>
                  <p style={{ ...mono, fontSize: 9, color: "#64748b", letterSpacing: "0.06em" }}>{role}</p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px 90px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 4vw, 42px)", letterSpacing: "-1.5px", color: "#fff", marginBottom: 12 }}>Honest pricing</h2>
          <p style={{ ...dm, fontSize: 14, color: "#64748b" }}>Free forever. Pay only if you want more.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, alignItems: "start" }}>
          {PRICING.map(({ tier, price, period, desc, features, cta, accent, highlight }) => (
            <div key={tier} style={{ position: "relative", transform: highlight ? "scale(1.03)" : undefined }}>
              {highlight && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(#0b0f19, #0b0f19) padding-box, linear-gradient(135deg, #00ffa3, #6e00ff) border-box", border: "1px solid transparent", borderRadius: 16 }} />}
              <div style={{ position: "relative", background: highlight ? "rgba(0,255,163,0.04)" : "rgba(255,255,255,0.04)", border: highlight ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 26, backdropFilter: "blur(12px)" }}>
                {highlight && <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #00ffa3, #00cc82)", borderRadius: "0 0 8px 8px", padding: "3px 12px" }}><span style={{ ...mono, fontSize: 9, color: "#0b0f19", fontWeight: 700, letterSpacing: "0.1em" }}>MOST POPULAR</span></div>}
                <span style={{ ...mono, fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: "0.12em" }}>{tier}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, margin: "8px 0" }}>
                  <span style={{ ...syne, fontWeight: 800, fontSize: 36, color: "#fff", lineHeight: 1 }}>{price}</span>
                  <span style={{ ...dm, fontSize: 13, color: "#64748b" }}>{period}</span>
                </div>
                <p style={{ ...dm, fontSize: 12, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>{desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 17, height: 17, borderRadius: "50%", background: `${accent}18`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={9} style={{ color: accent }} /></div>
                      <span style={{ ...dm, fontSize: 13, color: "#cbd5e1" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onRegister} style={{ ...dm, fontSize: 13, fontWeight: 700, width: "100%", background: highlight ? `linear-gradient(135deg, ${accent}, #00cc82)` : `${accent}18`, color: highlight ? "#0b0f19" : accent, border: highlight ? "none" : `1px solid ${accent}35`, borderRadius: 10, padding: "11px", cursor: "pointer", boxShadow: highlight ? `0 0 24px ${accent}30` : "none" }}>{cta}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 40px" }}>
        <div style={{ borderRadius: 22, padding: "60px 44px", textAlign: "center", background: "rgba(0,255,163,0.03)", border: "1px solid rgba(0,255,163,0.14)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "radial-gradient(ellipse, rgba(0,255,163,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 5vw, 50px)", letterSpacing: "-2px", color: "#fff", marginBottom: 14 }}>
              Start today. <ShinyText>Stay on edge.</ShinyText>
            </h2>
            <p style={{ ...dm, fontSize: 16, color: "#64748b", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.65 }}>
              Everything you're working on — in one place that actually looks good.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={onRegister} style={{ ...dm, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", border: "none", borderRadius: 10, padding: "13px 26px", cursor: "pointer", boxShadow: "0 0 36px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", gap: 7 }}>
                Create free account <ArrowRight size={15} />
              </button>
              <button onClick={onLogin} style={{ ...dm, fontSize: 15, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "13px 26px", cursor: "pointer" }}>Sign in</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "36px 40px", background: "rgba(8,12,21,0.5)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={11} style={{ color: "#0b0f19" }} /></div>
              <span style={{ ...syne, fontWeight: 800, fontSize: 14, background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
            </div>
            <p style={{ ...dm, fontSize: 12, color: "#374151", maxWidth: 200, lineHeight: 1.6 }}>A personal task manager for people who want to get things done.</p>
          </div>
          {[
            { title: "Product", links: ["Features","Pricing","Changelog"] },
            { title: "Legal",   links: ["Privacy","Terms","Cookies"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p style={{ ...mono, fontSize: 9, color: "#374151", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {links.map(l => <span key={l} style={{ ...dm, fontSize: 12, color: "#64748b", cursor: "pointer" }}>{l}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: "24px auto 0", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <p style={{ ...mono, fontSize: 9, color: "#1f2937", letterSpacing: "0.1em" }}>© 2026 EDGEBOARD</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Lock size={9} style={{ color: "#1f2937" }} /><span style={{ ...mono, fontSize: 9, color: "#1f2937", letterSpacing: "0.1em" }}>PRIVACY FIRST · NO DATA SELLING</span></div>
        </div>
      </footer>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [page,     setPage]     = useState<AppPage>("board");
  const [tasks,    setTasks]    = useState<Task[]>(INITIAL_TASKS);
  const [modalTask, setModalTask] = useState<Task | "new" | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);

  const handleStatusChange = useCallback((id: string, status: Status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setDrawerTask(prev => prev?.id === id ? { ...prev, status } : prev);
  }, []);

  const handleSaveTask = useCallback((task: Task) => {
    setTasks(prev => prev.some(t => t.id === task.id) ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]);
  }, []);

  const handleDeleteCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status !== "completed"));
  }, []);

  const openEdit = (t: Task) => { setDrawerTask(null); setModalTask(t); };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <GridBackground />

      <div className="relative z-10 min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {appState === "landing"  && <LandingPage onLogin={() => setAppState("login")} onRegister={() => setAppState("register")} />}
        {appState === "login"    && <LoginPage    onLogin={() => setAppState("app")}  onGoRegister={() => setAppState("register")} />}
        {appState === "register" && <RegisterPage onRegister={() => setAppState("app")} onGoLogin={() => setAppState("login")} />}

        {appState === "app" && (
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-52 shrink-0 flex flex-col h-full" style={{ background: "rgba(8,12,21,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "22px 18px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 12px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={12} style={{ color: "#0b0f19" }} />
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EdgeBoard</span>
                </div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#1f2937", textTransform: "uppercase", letterSpacing: "0.15em", marginLeft: 34 }}>Personal</p>
              </div>

              <nav style={{ flex: 1, padding: "0 9px", display: "flex", flexDirection: "column", gap: 2 }}>
                <NavItem icon={LayoutGrid} label="My Tasks"  active={page === "board"}     onClick={() => setPage("board")} />
                <NavItem icon={BarChart2}  label="Overview"  active={page === "stats"}     onClick={() => setPage("stats")} />
                <NavItem icon={PieChart}   label="Analytics" active={page === "analytics"} onClick={() => setPage("analytics")} />
                <NavItem icon={Settings}   label="Settings"  active={page === "settings"}  onClick={() => setPage("settings")} />
                <NavItem icon={Cpu}        label="System"    active={page === "specs"}     onClick={() => setPage("specs")} />
              </nav>

              <div style={{ padding: "10px 9px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#0b0f19", flexShrink: 0 }}>AR</div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#cbd5e1", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Alex Rivera</p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>Free plan</p>
                  </div>
                  <button onClick={() => setAppState("landing")} style={{ color: "#374151", background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Sign out"><LogOut size={12} /></button>
                </div>
                <p style={{ textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#1f2937", marginTop: 10, letterSpacing: "0.1em" }}>© 2026 EDGEBOARD</p>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto p-8">
              {page === "board"     && <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} onOpenCreate={() => setModalTask("new")} onOpenEdit={openEdit} onOpenDetail={t => setDrawerTask(t)} />}
              {page === "stats"     && <DashboardStats tasks={tasks} />}
              {page === "analytics" && <AnalyticsPage  tasks={tasks} />}
              {page === "settings"  && <SettingsPage   onLogout={() => setAppState("landing")} onDeleteCompleted={handleDeleteCompleted} />}
              {page === "specs"     && <SystemSpecs />}
            </main>
          </div>
        )}
      </div>

      {modalTask !== null && (
        <TaskModal initial={modalTask === "new" ? undefined : modalTask} onClose={() => setModalTask(null)} onSave={handleSaveTask} />
      )}

      {drawerTask && (
        <TaskDrawer task={drawerTask} onClose={() => setDrawerTask(null)} onEdit={() => openEdit(drawerTask)} onStatusChange={(id, s) => { handleStatusChange(id, s); setDrawerTask(prev => prev ? { ...prev, status: s } : prev); }} />
      )}
    </>
  );
}

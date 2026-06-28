import { useState, useRef, useCallback, useEffect } from "react";
import {
  LayoutGrid, BarChart2, Cpu, Search, Plus, Play, CheckCircle, RotateCcw,
  X, AlertTriangle, Clock, ChevronDown, Zap, TrendingUp, ListChecks, Timer,
  Flame, Eye, EyeOff, Github, Chrome, ArrowRight, Settings, PieChart,
  User, Shield, MessageCircle, Activity, Tag, Calendar, Pencil,
  LogOut, RefreshCw, Star, Check, Menu, Layers, Lock,
  BookOpen, Dumbbell, DollarSign, Briefcase, Palette, Smile,
  Sun, Moon,
} from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { taskService, authService } from "../services/api";
import TargetCursor from "../components/TargetCursor/TargetCursor";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "critical" | "high" | "medium" | "low";
type Status   = "pending" | "in-progress" | "completed" | "overdue";
type Category = "work" | "personal" | "health" | "learning" | "finance" | "creative";
type AppPage  = "board" | "stats" | "analytics" | "settings";
type AppState = "landing" | "login" | "register" | "app";

interface ActivityEntry {
  id: string;
  type: "created" | "status" | "comment" | "assigned";
  user: string;
  time: string;
  message: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  dueDate: string;
  tags: string[];
  description: string;
  activity: ActivityEntry[];
  createdAt?: string;
  updatedAt?: string;
  timeTracked?: number;
  timerStartedAt?: string;
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

const getPriorityConfig = (priority: Priority, theme: "dark" | "light" = "dark") => {
  const isDark = theme === "dark";
  const cfgs: Record<Priority, { label: string; color: string; bg: string }> = {
    critical: { label: "CRITICAL", color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
    high:     { label: "HIGH",     color: isDark ? "#f59e0b" : "#d97706", bg: isDark ? "rgba(245,158,11,0.12)" : "rgba(217,119,6,0.08)" },
    medium:   { label: "MEDIUM",   color: isDark ? "#3b82f6" : "#2563eb", bg: isDark ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.08)" },
    low:      { label: "LOW",      color: isDark ? "#64748b" : "#475569", bg: isDark ? "rgba(100,116,139,0.12)" : "rgba(71,85,105,0.08)" },
  };
  return cfgs[priority] || cfgs.medium;
};

const getStatusConfig = (status: Status, theme: "dark" | "light" = "dark") => {
  const isDark = theme === "dark";
  const cfgs: Record<Status, { label: string; color: string }> = {
    "pending":     { label: "PENDING",     color: isDark ? "#cbd5e1" : "#475569" },
    "in-progress": { label: "IN PROGRESS", color: isDark ? "#00ffa3" : "#6e00ff" },
    "completed":   { label: "COMPLETED",   color: isDark ? "#00ffa3" : "#00b875" },
    "overdue":     { label: "OVERDUE",     color: "#f43f5e" },
  };
  return cfgs[status] || cfgs.pending;
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(ms: number) {
  if (!ms || ms < 0) return "0s";
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

// ─── Global Styles ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes shiny    { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeIn   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes ticker   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes blurIn   { to { opacity: 1; filter: blur(0); transform: translateY(0); } }
  @keyframes charFadeUp { to { opacity: 1; transform: translateY(0); } }
  @keyframes sweep    { 0% { left: -100%; } 50% { left: 100%; } 100% { left: 100%; } }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,163,0.3); }
  select option { background: #0f1526; color: #fff; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
  .drawer-open { animation: slideRight 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  .page-enter  { animation: fadeIn 0.25s ease forwards; }
  .gradient-logo-text {
    font-family: 'Syne', sans-serif !important;
    font-weight: 800 !important;
    letter-spacing: -0.5px !important;
    display: inline-block !important;
    background-size: 100% !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    color: transparent !important;
  }
  
  /* Sidebar responsive logic */
  @media (max-width: 768px) {
    .dashboard-sidebar {
      position: fixed !important;
      left: -100% !important;
      top: 0 !important;
      bottom: 0 !important;
      z-index: 100 !important;
      transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      box-shadow: 0 40px 80px rgba(0,0,0,0.5) !important;
    }
    .dashboard-sidebar.mobile-open {
      left: 0 !important;
    }
    .sidebar-overlay {
      display: block !important;
    }
    .main-content {
      padding: 20px 16px !important;
    }
  }
  @media (min-width: 769px) {
    .dashboard-sidebar {
      position: relative !important;
      left: 0 !important;
    }
    .sidebar-overlay {
      display: none !important;
    }
    .mobile-header {
      display: none !important;
    }
  }
`;

// ─── Base UI ──────────────────────────────────────────────────────────────────

function GridBackground({ theme }: { theme: "dark" | "light" }) {
  const isDark = theme === "dark";
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,255,163,0.025)" : "rgba(0,184,117,0.04)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(0,255,163,0.025)" : "rgba(0,184,117,0.04)"} 1px, transparent 1px)`,
        backgroundSize: "50px 50px"
      }} />
      <div className="absolute inset-0" style={{
        background: isDark
          ? "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,27,75,0.65) 0%, transparent 70%)"
          : "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(224,242,254,0.7) 0%, transparent 70%)"
      }} />
      <div className="absolute inset-0" style={{
        background: isDark
          ? "radial-gradient(ellipse 40% 40% at 80% 80%, rgba(110,0,255,0.06) 0%, transparent 60%)"
          : "radial-gradient(ellipse 40% 40% at 80% 80%, rgba(110,0,255,0.02) 0%, transparent 60%)"
      }} />
    </div>
  );
}

function SpotlightCard({ children, className = "", glowColor = "#00ffa3", onClick, theme = "dark" }: { children: React.ReactNode; className?: string; glowColor?: string; onClick?: () => void; theme?: "dark" | "light" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, []);

  const isDark = theme === "dark";

  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
        borderColor: hovered ? `${glowColor}40` : isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
        backdropFilter: "blur(12px)",
        boxShadow: hovered ? `0 10px 30px ${glowColor}15` : isDark ? "none" : "0 4px 20px rgba(0,0,0,0.02)"
      }}>
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

function BlurText({ text, delay = 35, className = "", shiny = false }: { text: string; delay?: number; className?: string; shiny?: boolean }) {
  const words = text.split(" ");
  const shinyStyle: React.CSSProperties = shiny ? {
    background: "linear-gradient(90deg, #ffffff 0%, #00ffa3 40%, #ffffff 60%, #6e00ff 100%)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    display: "inline-block"
  } : {};

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block" style={{
          animation: "blurIn 0.45s ease-out forwards",
          animationDelay: `${i * delay}ms`,
          opacity: 0,
          filter: "blur(6px)",
          transform: "translateY(6px)",
          marginRight: "0.25em"
        }}>
          <span style={{
            ...shinyStyle,
            animation: shiny ? "shiny 4s linear infinite" : undefined
          }}>
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

function SplitText({ text, delay = 25, className = "" }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <span key={i} className="inline-block" style={{
          animation: "charFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          animationDelay: `${i * delay}ms`,
          opacity: 0,
          transform: "translateY(12px)",
          whiteSpace: char === " " ? "pre" : "normal"
        }}>
          {char}
        </span>
      ))}
    </span>
  );
}

function FadeContent({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(18px)",
      transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)`,
      transitionDelay: `${delay}ms`
    }}>
      {children}
    </div>
  );
}

function ShinyButton({ children, onClick, style = {}, className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`relative overflow-hidden group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        outline: "none",
        ...style
      }}>
      <div className="absolute top-0 bottom-0"
        style={{
          width: "40%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)",
          transform: "skewX(-22deg)",
          top: 0,
          bottom: 0,
          left: "-100%",
          animation: "sweep 3.2s ease-in-out infinite",
          pointerEvents: "none"
        }} />
      <span className="relative z-10 flex items-center gap-2" style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>{children}</span>
    </button>
  );
}

function Spinner() {
  return <div style={{ width: 18, height: 18, border: "2px solid rgba(11,15,25,0.3)", borderTopColor: "#0b0f19", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

function CategoryBadge({ category }: { category: Category }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.work;
  const Icon = cfg.icon;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 6, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
      <Icon size={10} style={{ color: cfg.color }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{cfg.label}</span>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onGoRegister, theme = "dark", onLogoClick }: { onLogin: () => void; onGoRegister: () => void; theme?: "dark" | "light"; onLogoClick?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const handleGoogleSignIn = () => {
    const origin = window.location.origin;
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    
    if (clientId) {
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${origin}&response_type=token&scope=email profile`;
      window.location.href = url;
    } else {
      window.location.href = `${origin}/#access_token=mock_google_token&email=jordan@colledge.in&name=Jordan+Lee`;
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setSubmitError("");
    try {
      const credentials = await authService.login(email, password);
      localStorage.setItem("user_email", credentials.email);
      localStorage.setItem("user_name", credentials.name || email.split("@")[0]);
      const initials = (credentials.name || email).split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
      localStorage.setItem("user_initials", initials || "U");
      onLogin();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  const inputStyle = (err: boolean): React.CSSProperties => ({
    width: "100%",
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: `1px solid ${err ? "#f43f5e" : isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    borderRadius: 10,
    color: isDark ? "#fff" : "#0f172a",
    padding: "11px 14px",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: "relative", zIndex: 10 }}>
      <div className="w-full max-w-md page-enter">
        <button onClick={onLogoClick} className="cursor-target" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: isDark ? "#64748b" : "#475569", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = isDark ? "#cbd5e1" : "#0f172a"} onMouseLeave={e => e.currentTarget.style.color = isDark ? "#64748b" : "#475569"}>
          <ArrowRight size={12} style={{ transform: "rotate(180deg)" }} /> Back to Home
        </button>
        <div className="text-center mb-10">
          <div onClick={onLogoClick} className="cursor-pointer cursor-target" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 20px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: "#0b0f19" }} />
            </div>
            <span className="gradient-logo-text" style={{ fontSize: 22, background: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)" }}>EdgeBoard</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: isDark ? "#fff" : "#0f172a", letterSpacing: "-1px", marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: isDark ? "#64748b" : "#475569", fontSize: 14 }}>Sign in to your personal dashboard</p>
        </div>

        <SpotlightCard className="p-8" glowColor="#00ffa3" theme={theme}>
          <div className="flex gap-3 mb-6">
            <button onClick={handleGoogleSignIn} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, color: isDark ? "#cbd5e1" : "#334155", fontFamily: "'DM Sans', sans-serif" }}>
              <Chrome size={15} /> Google
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }} />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input style={inputStyle(!!errors.email)} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              {errors.email && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{errors.email}</p>}
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inputStyle(!!errors.password), paddingRight: 44 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{errors.password}</p>}
            </div>
            {submitError && <p style={{ color: "#f43f5e", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />{submitError}</p>}
            <ShinyButton onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif", background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", boxShadow: isDark ? "0 0 24px rgba(0,255,163,0.3)" : "0 4px 14px rgba(110,0,255,0.2)" }}>
              {loading ? <><Spinner />Signing in…</> : <>Sign In <ArrowRight size={15} /></>}
            </ShinyButton>
          </div>
        </SpotlightCard>

        <p style={{ textAlign: "center", color: isDark ? "#64748b" : "#475569", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 20 }}>
          No account? <button onClick={onGoRegister} style={{ color: isDark ? "#00ffa3" : "#6e00ff", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Create one →</button>
        </p>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

function RegisterPage({ onRegister, onGoLogin, theme = "dark", onLogoClick }: { onRegister: () => void; onGoLogin: () => void; theme?: "dark" | "light"; onLogoClick?: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", terms: false });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

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

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setSubmitError("");
    try {
      await authService.register(form.name, form.email, form.password);
      localStorage.setItem("user_email", form.email);
      localStorage.setItem("user_name", form.name);
      const initials = form.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
      localStorage.setItem("user_initials", initials || "U");
      onRegister();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  const inputStyle = (err: boolean): React.CSSProperties => ({
    width: "100%",
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: `1px solid ${err ? "#f43f5e" : isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    borderRadius: 10,
    color: isDark ? "#fff" : "#0f172a",
    padding: "11px 14px",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ position: "relative", zIndex: 10 }}>
      <div className="w-full max-w-md page-enter">
        <button onClick={onLogoClick} className="cursor-target" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: isDark ? "#64748b" : "#475569", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = isDark ? "#cbd5e1" : "#0f172a"} onMouseLeave={e => e.currentTarget.style.color = isDark ? "#64748b" : "#475569"}>
          <ArrowRight size={12} style={{ transform: "rotate(180deg)" }} /> Back to Home
        </button>
        <div className="text-center mb-8">
          <div onClick={onLogoClick} className="cursor-pointer cursor-target" style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: "8px", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 20px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: "#0b0f19" }} />
            </div>
            <span className="gradient-logo-text" style={{ fontSize: 22, background: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)" }}>EdgeBoard</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: isDark ? "#fff" : "#0f172a", letterSpacing: "-1px", marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: isDark ? "#64748b" : "#475569", fontSize: 14 }}>Your personal command centre starts here</p>
        </div>

        <SpotlightCard className="p-8" glowColor="#6e00ff" theme={theme}>
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Your Name</label>
              <input style={inputStyle(!!errors.name)} placeholder="Alex Rivera" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input style={inputStyle(!!errors.email)} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle(!!errors.password), paddingRight: 40 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", background: "none", border: "none", cursor: "pointer" }}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {errors.password && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.password}</p>}
              </div>
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Confirm</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle(!!errors.confirm), paddingRight: 40 }} type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                  <button onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", background: "none", border: "none", cursor: "pointer" }}>{showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {errors.confirm && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.confirm}</p>}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <div onClick={() => setForm({ ...form, terms: !form.terms })}
                style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${form.terms ? (isDark ? "#00ffa3" : "#6e00ff") : errors.terms ? "#f43f5e" : isDark ? "rgba(255,255,255,0.2)" : "rgba(15,23,42,0.2)"}`, background: form.terms ? (isDark ? "rgba(0,255,163,0.15)" : "rgba(110,0,255,0.15)") : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0, transition: "all 0.2s" }}>
                {form.terms && <CheckCircle size={11} style={{ color: isDark ? "#00ffa3" : "#6e00ff" }} />}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: isDark ? "#cbd5e1" : "#334155", lineHeight: 1.5 }}>
                I agree to the <span style={{ color: isDark ? "#00ffa3" : "#6e00ff" }}>Terms of Service</span> and <span style={{ color: isDark ? "#00ffa3" : "#6e00ff" }}>Privacy Policy</span>
              </span>
            </label>
            {errors.terms && <p style={{ color: "#f43f5e", fontSize: 12, marginTop: -8 }}>{errors.terms}</p>}
            {submitError && <p style={{ color: "#f43f5e", fontSize: 12 }}>{submitError}</p>}
            <ShinyButton onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif", background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", boxShadow: isDark ? "0 0 24px rgba(0,255,163,0.3)" : "0 4px 14px rgba(110,0,255,0.2)", marginTop: 4 }}>
              {loading ? <><Spinner />Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
            </ShinyButton>
          </div>
        </SpotlightCard>

        <p style={{ textAlign: "center", color: isDark ? "#64748b" : "#475569", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 20 }}>
          Already have an account? <button onClick={onGoLogin} style={{ color: isDark ? "#00ffa3" : "#6e00ff", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Sign in →</button>
        </p>
      </div>
    </div>
  );
}
function TaskModal({ initial, onClose, onSave, theme = "dark" }: { initial?: Task; onClose: () => void; onSave: (t: Task) => void; theme?: "dark" | "light" }) {
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
      activity: initial?.activity ?? [{ id: `ac${Date.now()}`, type: "created", user: "You", time: "just now", message: "Task added." }],
      timeTracked: initial?.timeTracked ?? 0,
      timerStartedAt: initial?.timerStartedAt ?? "",
    });
    onClose();
  };

  const isDark = theme === "dark";

  const inputCls: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    borderRadius: 8,
    color: isDark ? "#fff" : "#0f172a",
    padding: "10px 14px",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl p-7 page-enter" style={{ background: isDark ? "rgba(12,18,34,0.97)" : "rgba(255,255,255,0.97)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, backdropFilter: "blur(24px)", boxShadow: isDark ? "0 0 60px rgba(0,255,163,0.07), 0 40px 80px rgba(0,0,0,0.7)" : "0 10px 40px rgba(0,0,0,0.06)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: isDark ? "#fff" : "#0f172a" }}>{initial ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} style={{ color: isDark ? "#64748b" : "#475569" }} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Title *</label>
            <input style={{ ...inputCls, borderColor: errors.title ? "#f43f5e" : isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)" }} placeholder="What do you need to do?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            {errors.title && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.title}</p>}
          </div>

          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {(["work","personal","health","learning","finance","creative"] as Category[]).map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const isSelected = form.category === cat;
                return (
                  <button key={cat} onClick={() => setForm({ ...form, category: cat })} className="py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer"
                    style={{
                      background: isSelected ? `${cfg.color}15` : isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
                      border: isSelected ? `1.5px solid ${cfg.color}` : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}`,
                      color: isSelected ? cfg.color : isDark ? "#64748b" : "#475569",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 500
                    }}>
                    <Icon size={12} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Priority</label>
              <div style={{ position: "relative" }}>
                <select style={{ ...inputCls, appearance: "none", paddingRight: 32, cursor: "pointer" } as React.CSSProperties} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                  {(["critical","high","medium","low"] as Priority[]).map(p => <option key={p} value={p}>{getPriorityConfig(p, theme).label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Due Date *</label>
              <input type="date" style={{ ...inputCls, colorScheme: isDark ? "dark" : "light", borderColor: errors.dueDate ? "#f43f5e" : isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)" }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              {errors.dueDate && <p style={{ color: "#f43f5e", fontSize: 11, marginTop: 3 }}>{errors.dueDate}</p>}
            </div>
          </div>

          {initial && (
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Status</label>
              <div style={{ position: "relative" }}>
                <select style={{ ...inputCls, appearance: "none", paddingRight: 32, cursor: "pointer" } as React.CSSProperties} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                  {(["pending","in-progress","completed","overdue"] as Status[]).map(s => <option key={s} value={s}>{getStatusConfig(s, theme).label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", pointerEvents: "none" }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Notes</label>
            <textarea style={{ ...inputCls, resize: "vertical", minHeight: 72, lineHeight: 1.6 }} placeholder="Any details, context, or reminders…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Tags (comma-separated)</label>
            <input style={inputCls} placeholder="e.g. reading, fitness, goals" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00ffa3, #00cc82)", color: "#0b0f19", boxShadow: "0 0 20px rgba(0,255,163,0.25)" }}>
            {initial ? "Save Changes" : "Add Task"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Drawer ──────────────────────────────────────────────────────────────

function TaskDrawer({ task, onClose, onEdit, onStatusChange, onSave, theme = "dark" }: { task: Task; onClose: () => void; onEdit: () => void; onStatusChange: (id: string, s: Status) => void; onSave: (task: Task) => void; theme?: "dark" | "light" }) {
  const p = getPriorityConfig(task.priority, theme);
  const s = getStatusConfig(task.status, theme);
  const [comment, setComment] = useState("");
  const isDark = theme === "dark";

  const [liveElapsed, setLiveElapsed] = useState(0);

  useEffect(() => {
    if (task.status === "in-progress" && task.timerStartedAt) {
      const interval = setInterval(() => {
        const elapsed = new Date().getTime() - new Date(task.timerStartedAt!).getTime();
        setLiveElapsed(elapsed > 0 ? elapsed : 0);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveElapsed(0);
    }
  }, [task.status, task.timerStartedAt]);

  const displayTime = (task.timeTracked || 0) + liveElapsed;

  const handlePostComment = () => {
    const text = comment.trim();
    if (!text) return;

    const newEntry: ActivityEntry = {
      id: `ac${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: "comment",
      user: localStorage.getItem("user_name") || "You",
      time: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      message: `Commented: "${text}"`
    };

    onSave({
      ...task,
      activity: [...(task.activity || []), newEntry]
    });
    setComment("");
  };

  return (
    <div className="fixed inset-0 z-40 flex" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="drawer-open w-full max-w-md h-full flex flex-col"
        style={{ background: isDark ? "rgba(10,15,28,0.98)" : "rgba(255,255,255,0.98)", borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`, backdropFilter: "blur(20px)", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 24px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}` }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CategoryBadge category={task.category} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: p.color, background: p.bg, padding: "2px 7px", borderRadius: 4 }}>{p.label}</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: isDark ? "#fff" : "#0f172a", lineHeight: 1.4 }}>{task.title}</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, background: isDark ? "rgba(0,255,163,0.08)" : "rgba(110,0,255,0.06)", border: `1px solid ${isDark ? "rgba(0,255,163,0.2)" : "rgba(110,0,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Pencil size={12} style={{ color: isDark ? "#00ffa3" : "#6e00ff" }} />
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={13} style={{ color: isDark ? "#64748b" : "#475569" }} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: displayTime > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
            {[
              { icon: Calendar, label: "Due Date", value: formatDate(task.dueDate) },
              { icon: Tag,      label: "Tags",     value: (task.tags && task.tags.length) ? task.tags.map(t => `#${t}`).join(" ") : "—" },
              ...(displayTime > 0 ? [{ icon: Timer, label: "Time Spent", value: formatDuration(displayTime) }] : [])
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><Icon size={10} style={{ color: isDark ? "#64748b" : "#475569" }} /><span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span></div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isDark ? "#cbd5e1" : "#334155" }}>{value}</p>
              </div>
            ))}
          </div>

          {task.description && (
            <div>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Notes</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: isDark ? "#94a3b8" : "#334155", lineHeight: 1.7 }}>{task.description}</p>
            </div>
          )}

          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Status</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["pending","in-progress","completed","overdue"] as Status[]).map(st => {
                const cfg = getStatusConfig(st, theme);
                const active = task.status === st;
                return (
                  <button key={st} onClick={() => onStatusChange(task.id, st)}
                    style={{ padding: "6px 12px", borderRadius: 8, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", background: active ? `${cfg.color}18` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)"), border: `1px solid ${active ? cfg.color + "50" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)")}`, color: active ? cfg.color : (isDark ? "#64748b" : "#475569"), cursor: "pointer", transition: "all 0.15s" }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Activity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {task.activity.map(entry => (
                <div key={entry.id} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: isDark ? "rgba(0,255,163,0.08)" : "rgba(110,0,255,0.06)", border: `1px solid ${isDark ? "rgba(0,255,163,0.2)" : "rgba(110,0,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: isDark ? "#00ffa3" : "#6e00ff", marginTop: 2 }}>
                    {entry.type === "created" ? <Plus size={10} /> : entry.type === "status" ? <RefreshCw size={10} /> : <MessageCircle size={10} />}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isDark ? "#cbd5e1" : "#334155" }}>{entry.message}</p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", marginTop: 2 }}>{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note…"
                style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`, color: isDark ? "#fff" : "#0f172a", padding: "8px 12px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                onKeyDown={e => { if (e.key === "Enter") { handlePostComment(); } }} />
              <button onClick={handlePostComment}
                style={{ padding: "8px 14px", borderRadius: 8, background: isDark ? "rgba(0,255,163,0.1)" : "rgba(110,0,255,0.08)", border: `1px solid ${isDark ? "rgba(0,255,163,0.2)" : "rgba(110,0,255,0.15)"}`, color: isDark ? "#00ffa3" : "#6e00ff", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
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

function TaskCard({ task, onStatusChange, onOpen, onEdit, theme = "dark" }: { task: Task; onStatusChange: (id: string, s: Status) => void; onOpen: () => void; onEdit: () => void; theme?: "dark" | "light" }) {
  const p = getPriorityConfig(task.priority, theme);
  const s = getStatusConfig(task.status, theme);
  const isActive  = task.status === "in-progress";
  const isOverdue = task.status === "overdue";
  const isDark = theme === "dark";

  const [liveElapsed, setLiveElapsed] = useState(0);

  useEffect(() => {
    if (task.status === "in-progress" && task.timerStartedAt) {
      const interval = setInterval(() => {
        const elapsed = new Date().getTime() - new Date(task.timerStartedAt!).getTime();
        setLiveElapsed(elapsed > 0 ? elapsed : 0);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveElapsed(0);
    }
  }, [task.status, task.timerStartedAt]);

  const displayTime = (task.timeTracked || 0) + liveElapsed;

  return (
    <div className="relative rounded-xl overflow-hidden group" style={{ backdropFilter: "blur(12px)" }}>
      {isActive && <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: isDark ? "linear-gradient(#0b0f19, #0b0f19) padding-box, linear-gradient(90deg, #00ffa3, #6e00ff, #00ffa3) border-box" : "linear-gradient(#f8fafc, #f8fafc) padding-box, linear-gradient(90deg, #00b875, #6e00ff, #00b875) border-box", border: "1px solid transparent" }} />}
      <div className="relative p-5 rounded-xl flex flex-col justify-between" style={{ minHeight: 175, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)", border: isActive ? "1px solid transparent" : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}` }}>
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <h3 className={`cursor-pointer transition-colors ${isDark ? "hover:text-[#00ffa3]" : "hover:text-[#6e00ff]"}`} style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: isDark ? "#fff" : "#0f172a", lineHeight: 1.4, flex: 1 }} onClick={onOpen}>{task.title}</h3>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)" }}>
                <Pencil size={10} style={{ color: isDark ? "#64748b" : "#475569" }} />
              </button>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: p.color, background: p.bg, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.08em" }}>{p.label}</span>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <CategoryBadge category={task.category} />
          </div>

          {task.tags && task.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {task.tags.map(tag => (
                <span key={tag} style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "2px 6px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)", color: isDark ? "#cbd5e1" : "#475569", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}` }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          {(displayTime > 0 || isActive) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "6px 8px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)"}`, borderRadius: 8 }}>
              <Timer size={10} style={{ color: isActive ? (isDark ? "#00ffa3" : "#6e00ff") : (isDark ? "#64748b" : "#475569") }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Time spent:</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: isActive ? (isDark ? "#00ffa3" : "#6e00ff") : (isDark ? "#cbd5e1" : "#334155") }}>
                {formatDuration(displayTime)}
              </span>
              {isActive && (
                <span className="flex h-1.5 w-1.5 ml-auto relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={10} style={{ color: isOverdue ? "#f43f5e" : (isDark ? "#64748b" : "#475569") }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isOverdue ? "#f43f5e" : (isDark ? "#64748b" : "#475569") }}>{formatDate(task.dueDate)}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: s.color, marginLeft: 4, letterSpacing: "0.06em" }}>{s.label}</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {task.status !== "in-progress" && task.status !== "completed" && (
                <button onClick={() => onStatusChange(task.id, "in-progress")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer" style={{ background: isDark ? "rgba(0,255,163,0.1)" : "rgba(110,0,255,0.08)", border: isDark ? "1px solid rgba(0,255,163,0.2)" : "1px solid rgba(110,0,255,0.15)" }}>
                  <Play size={10} style={{ color: isDark ? "#00ffa3" : "#6e00ff" }} />
                </button>
              )}
              {task.status !== "completed" && (
                <button onClick={() => onStatusChange(task.id, "completed")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer" style={{ background: isDark ? "rgba(0,255,163,0.1)" : "rgba(110,0,255,0.08)", border: isDark ? "1px solid rgba(0,255,163,0.2)" : "1px solid rgba(110,0,255,0.15)" }}>
                  <CheckCircle size={10} style={{ color: isDark ? "#00ffa3" : "#6e00ff" }} />
                </button>
              )}
              {task.status === "completed" && (
                <button onClick={() => onStatusChange(task.id, "pending")} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer" style={{ background: isDark ? "rgba(100,116,139,0.1)" : "rgba(71,85,105,0.08)", border: isDark ? "1px solid rgba(100,116,139,0.2)" : "1px solid rgba(71,85,105,0.15)" }}>
                  <RotateCcw size={10} style={{ color: isDark ? "#64748b" : "#475569" }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty / No Results ───────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, body, action, onAction, theme = "dark" }: { icon: React.ElementType; title: string; body: string; action?: string; onAction?: () => void; theme?: "dark" | "light" }) {
  const isDark = theme === "dark";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon size={26} style={{ color: isDark ? "#cbd5e1" : "#475569" }} />
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: isDark ? "#fff" : "#0f172a", marginBottom: 6 }}>{title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: isDark ? "#64748b" : "#475569", maxWidth: 280, lineHeight: 1.6, marginBottom: action ? 20 : 0 }}>{body}</p>
      {action && onAction && (
        <button onClick={onAction} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.03] cursor-pointer"
          style={{ fontFamily: "'DM Sans', sans-serif", background: isDark ? "rgba(0,255,163,0.1)" : "rgba(110,0,255,0.08)", border: isDark ? "1px solid rgba(0,255,163,0.2)" : "1px solid rgba(110,0,255,0.15)", color: isDark ? "#00ffa3" : "#6e00ff" }}>
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

function TaskBoard({ tasks, onStatusChange, onOpenCreate, onOpenEdit, onOpenDetail, theme = "dark" }: {
  tasks: Task[]; onStatusChange: (id: string, s: Status) => void;
  onOpenCreate: () => void; onOpenEdit: (t: Task) => void; onOpenDetail: (t: Task) => void;
  theme?: "dark" | "light";
}) {
  const [search, setSearch] = useState("");
  const [filterStatus,   setFilterStatus]   = useState<Status | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<"dueDate" | "priority" | "status">("dueDate");

  const prioOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statOrder: Record<Status,   number> = { overdue: 0, "in-progress": 1, pending: 2, completed: 3 };

  const isDark = theme === "dark";

  const filtered = tasks
    .filter(t => {
      const tTitle = t.title || "";
      const tDesc = t.description || "";
      const tCat = t.category || "work";
      const tStatus = t.status || "pending";
      const tPrio = t.priority || "medium";

      if (search && !tTitle.toLowerCase().includes(search.toLowerCase()) && !tDesc.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus   !== "all" && tStatus   !== filterStatus)   return false;
      if (filterCategory !== "all" && tCat !== filterCategory) return false;
      if (filterPriority !== "all" && tPrio !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "dueDate") {
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      }
      const aPrio = prioOrder[a.priority] !== undefined ? prioOrder[a.priority] : 2;
      const bPrio = prioOrder[b.priority] !== undefined ? prioOrder[b.priority] : 2;
      if (sort === "priority") {
        return aPrio - bPrio;
      }
      const aStat = statOrder[a.status] !== undefined ? statOrder[a.status] : 2;
      const bStat = statOrder[b.status] !== undefined ? statOrder[b.status] : 2;
      return aStat - bStat;
    });

  const selStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    borderRadius: 8,
    color: isDark ? "#cbd5e1" : "#334155",
    padding: "8px 28px 8px 10px",
    fontSize: 11,
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.04em",
    appearance: "none",
    cursor: "pointer",
    outline: "none"
  };

  return (
    <div className="page-enter">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>My Tasks</h1></ShinyText>
          <p style={{ color: isDark ? "#64748b" : "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Everything on your plate, all in one place.</p>
        </div>
        <ShinyButton onClick={onOpenCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shrink-0"
          style={{ fontFamily: "'DM Sans', sans-serif", background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", boxShadow: isDark ? "0 0 24px rgba(0,255,163,0.3)" : "0 4px 14px rgba(110,0,255,0.2)" }}>
          <Plus size={16} /> Add Task
        </ShinyButton>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", pointerEvents: "none" }} />
          <input style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, borderRadius: 10, color: isDark ? "#fff" : "#0f172a", padding: "9px 14px 9px 36px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" }}
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
            <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748b" : "#475569", pointerEvents: "none" }} />
          </div>
        ))}
      </div>

      {tasks.length === 0
        ? <EmptyState icon={LayoutGrid} title="No tasks yet" body="Add your first task and start tracking everything that matters to you." action="Add Task" onAction={onOpenCreate} theme={theme} />
        : filtered.length === 0
          ? <NoResults onClear={() => { setSearch(""); setFilterStatus("all"); setFilterCategory("all"); setFilterPriority("all"); }} />
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "24px" }}>
              {filtered.map(t => <TaskCard key={t.id} task={t} onStatusChange={onStatusChange} onOpen={() => onOpenDetail(t)} onEdit={() => onOpenEdit(t)} theme={theme} />)}
            </div>
      }
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, glowColor, theme = "dark" }: { icon: React.ElementType; label: string; value: number; color: string; glowColor: string; theme?: "dark" | "light" }) {
  const isDark = theme === "dark";
  const displayColor = color === "#cbd5e1" && !isDark ? "#334155" : color;
  return (
    <SpotlightCard className="p-5" glowColor={glowColor} theme={theme}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color: displayColor }} />
        </div>
        <TrendingUp size={13} style={{ color: `${color}50` }} />
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: displayColor, textShadow: isDark ? `0 0 18px ${color}35` : "none", lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{label}</div>
    </SpotlightCard>
  );
}

function DashboardStats({ tasks, theme = "dark" }: { tasks: Task[]; theme?: "dark" | "light" }) {
  const total   = tasks.length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProg  = tasks.filter(t => t.status === "in-progress").length;
  const done    = tasks.filter(t => t.status === "completed").length;
  const over    = tasks.filter(t => t.status === "overdue").length;
  const isDark = theme === "dark";

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Overview</h1></ShinyText>
        <p style={{ color: isDark ? "#64748b" : "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>A snapshot of where everything stands.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={ListChecks}  label="Total"       value={total}   color={isDark ? "#cbd5e1" : "#475569"} glowColor={isDark ? "#cbd5e1" : "#6e00ff"} theme={theme} />
        <StatCard icon={Timer}       label="Pending"     value={pending} color={isDark ? "#3b82f6" : "#2563eb"} glowColor={isDark ? "#3b82f6" : "#2563eb"} theme={theme} />
        <StatCard icon={Zap}         label="Active"      value={inProg}  color={isDark ? "#00ffa3" : "#6e00ff"} glowColor={isDark ? "#00ffa3" : "#6e00ff"} theme={theme} />
        <StatCard icon={CheckCircle} label="Done"        value={done}    color={isDark ? "#00ffa3" : "#00b875"} glowColor={isDark ? "#00ffa3" : "#00b875"} theme={theme} />
        <StatCard icon={Flame}       label="Overdue"     value={over}    color="#f43f5e" glowColor="#f43f5e" theme={theme} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "By Category", glow: "#00ffa3", items: (Object.keys(CATEGORY_CONFIG) as Category[]).map(c => ({ label: CATEGORY_CONFIG[c].label, count: tasks.filter(t => t.category === c).length, color: CATEGORY_CONFIG[c].color })) },
          { title: "By Priority", glow: "#6e00ff", items: (["critical","high","medium","low"] as Priority[]).map(p => ({ label: getPriorityConfig(p, theme).label, count: tasks.filter(t => t.priority === p).length, color: getPriorityConfig(p, theme).color })) },
        ].map(({ title, glow, items }) => (
          <SpotlightCard key={title} className="p-6" glowColor={glow} theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>{title}</h3>
            {items.map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isDark ? "#cbd5e1" : "#334155" }}>{label}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569" }}>{count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)" }}>
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

function AnalyticsPage({ tasks, theme = "dark" }: { tasks: Task[]; theme?: "dark" | "light" }) {
  const isDark = theme === "dark";
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const hasActiveTimer = tasks.some(t => t.status === "in-progress" && t.timerStartedAt);
    if (hasActiveTimer) {
      const interval = setInterval(() => {
        setTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [tasks]);

  const TT_STYLE: React.CSSProperties = {
    background: isDark ? "rgba(10,15,28,0.95)" : "rgba(255,255,255,0.95)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: isDark ? "#cbd5e1" : "#334155"
  };

  const statusData = [
    { name: "Pending",     value: tasks.filter(t => t.status === "pending").length,     color: isDark ? "#3b82f6" : "#2563eb" },
    { name: "Active",      value: tasks.filter(t => t.status === "in-progress").length, color: isDark ? "#00ffa3" : "#6e00ff" },
    { name: "Completed",   value: tasks.filter(t => t.status === "completed").length,   color: isDark ? "#00ffa3" : "#00b875" },
    { name: "Overdue",     value: tasks.filter(t => t.status === "overdue").length,     color: "#f43f5e" },
  ].filter(d => d.value > 0);

  const catData = (Object.keys(CATEGORY_CONFIG) as Category[]).map(c => ({
    name: CATEGORY_CONFIG[c].label,
    Total: tasks.filter(t => t.category === c).length,
    Done:  tasks.filter(t => t.category === c && t.status === "completed").length,
  })).filter(d => d.Total > 0);

  const hasAnyTimeTracked = tasks.some(t => (t.timeTracked || 0) > 0 || (t.status === "in-progress" && t.timerStartedAt));
  const catTimeData = (Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
    let totalMs = tasks
      .filter(t => t.category === c)
      .reduce((acc, t) => {
        let tTime = t.timeTracked || 0;
        if (t.status === "in-progress" && t.timerStartedAt) {
          const elapsed = new Date().getTime() - new Date(t.timerStartedAt).getTime();
          if (elapsed > 0) tTime += elapsed;
        }
        return acc + tTime;
      }, 0);

    // If no time is tracked yet, show some premium mockup data to demonstrate features
    if (!hasAnyTimeTracked) {
      const mockMap: Record<Category, number> = {
        work: 12.5 * 3600000,
        personal: 4.2 * 3600000,
        health: 3.0 * 3600000,
        learning: 8.5 * 3600000,
        finance: 1.5 * 3600000,
        creative: 6.0 * 3600000
      };
      totalMs = mockMap[c] || 0;
    }

    const totalHours = Number((totalMs / 3600000).toFixed(2));
    return {
      name: CATEGORY_CONFIG[c].label,
      Hours: totalHours,
      color: CATEGORY_CONFIG[c].color
    };
  }).filter(d => d.Hours > 0);

  // Dynamic analysis helper: calculate last 7 days of task volume
  const getWeeklyTaskVolume = () => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

      const createdCount = tasks.filter(t => t.createdAt && new Date(t.createdAt).toDateString() === dateStr).length;
      const completedCount = tasks.filter(t => t.updatedAt && t.status === "completed" && new Date(t.updatedAt).toDateString() === dateStr).length;

      data.push({
        week: dayLabel,
        added: createdCount || 0,
        done: completedCount || 0
      });
    }
    // Fallback default structure if no dynamic data was recorded (to prevent empty charts)
    const hasAnyData = data.some(d => d.added > 0 || d.done > 0);
    if (!hasAnyData) {
      return [
        { week: "Mon", added: 2, done: 1 },
        { week: "Tue", added: 4, done: 2 },
        { week: "Wed", added: 3, done: 3 },
        { week: "Thu", added: 5, done: 2 },
        { week: "Fri", added: 2, done: 3 },
        { week: "Sat", added: tasks.length, done: tasks.filter(t => t.status === "completed").length },
        { week: "Sun", added: 0, done: 0 }
      ];
    }
    return data;
  };

  // Dynamic analysis helper: calculate backlog trends
  const getTrendData = () => {
    const today = new Date();
    const data = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateMs = date.getTime();

      const backlogCount = tasks.filter(t => {
        const createdTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
        return t.status !== "completed" && createdTime <= dateMs;
      }).length;

      const completedCount = tasks.filter(t => {
        const completedTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
        return t.status === "completed" && completedTime <= dateMs;
      }).length;

      data.push({
        date: label,
        active: backlogCount,
        completed: completedCount
      });
    }
    const hasAnyData = data.some(d => d.active > 0 || d.completed > 0);
    if (!hasAnyData) {
      return [
        { date: "Jun 1",  active: 3, completed: 1 },
        { date: "Jun 8",  active: 4, completed: 2 },
        { date: "Jun 15", active: 5, completed: 4 },
        { date: "Jun 22", active: 6, completed: 5 },
        { date: "Jun 29", active: tasks.filter(t => t.status !== "completed").length, completed: tasks.filter(t => t.status === "completed").length },
      ];
    }
    return data;
  };

  const weeklyData = getWeeklyTaskVolume();
  const trendData = getTrendData();
  const recentActivity = tasks.flatMap(t => (t.activity || []).map(a => ({ ...a, taskTitle: t.title || "Untitled Task" }))).slice(0, 8);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Analytics</h1></ShinyText>
        <p style={{ color: isDark ? "#64748b" : "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>
          Dynamic performance trends and productivity insights.{!hasAnyTimeTracked && " (Showing demo time data)"}
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={BarChart2} title="No analytics data yet" body="Analytics will appear once tasks are created and tracked across your board." theme={theme} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie: Status */}
          <SpotlightCard className="p-6" glowColor="#00ffa3" theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>Task Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} />
                <Legend formatter={(v) => <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#cbd5e1" : "#334155" }}>{v}</span>} />
              </RechartsPie>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Bar: by category */}
          <SpotlightCard className="p-6" glowColor="#6e00ff" theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>Tasks by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                <XAxis dataKey="name" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="Total" fill="#6e00ff" opacity={0.7} radius={[4,4,0,0]} />
                <Bar dataKey="Done"  fill={isDark ? "#00ffa3" : "#00b875"} opacity={0.85} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Bar: weekly volume */}
          <SpotlightCard className="p-6" glowColor="#3b82f6" theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>Weekly Task Volume</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                <XAxis dataKey="week" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="added" fill="#3b82f6" opacity={0.6} radius={[4,4,0,0]} name="Added" />
                <Bar dataKey="done"  fill={isDark ? "#00ffa3" : "#00b875"} opacity={0.85} radius={[4,4,0,0]} name="Done" />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Line: backlog velocity */}
          <SpotlightCard className="p-6" glowColor="#f59e0b" theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>Productivity Velocity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                <XAxis dataKey="date" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="active"    fill="#f59e0b" opacity={0.6} radius={[4,4,0,0]} name="Backlog" />
                <Bar dataKey="completed" fill={isDark ? "#00ffa3" : "#00b875"} opacity={0.85} radius={[4,4,0,0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Bar: productive time by category */}
          <SpotlightCard className="p-6 lg:col-span-2" glowColor="#00ffa3" theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>Productive Hours Spent by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                <XAxis dataKey="name" tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: isDark ? "#64748b" : "#475569" }} axisLine={false} tickLine={false} allowDecimals={true} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="Hours" radius={[4,4,0,0]} name="Hours Spent">
                  {catTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SpotlightCard>

          {/* Activity Log list */}
          <SpotlightCard className="p-6 lg:col-span-2" glowColor="#cbd5e1" theme={theme}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16 }}>Recent Activity History</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {recentActivity.length ? recentActivity.map((act, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "start", paddingBottom: 12, borderBottom: i < recentActivity.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)"}` : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: isDark ? "rgba(0,255,163,0.08)" : "rgba(110,0,255,0.06)", border: `1px solid ${isDark ? "rgba(0,255,163,0.2)" : "rgba(110,0,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", shrink: 0, color: isDark ? "#00ffa3" : "#6e00ff", marginTop: 2 }}>
                    {act.type === "created" ? <Plus size={10} /> : act.type === "status" ? <RefreshCw size={10} /> : <MessageCircle size={10} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isDark ? "#cbd5e1" : "#334155" }}>
                      <span style={{ fontWeight: 600, color: isDark ? "#fff" : "#0f172a" }}>{act.taskTitle}</span>: {act.message}
                    </p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", marginTop: 2 }}>{act.time}</p>
                  </div>
                </div>
              )) : (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isDark ? "#64748b" : "#475569", textAlign: "center", padding: "32px 0" }}>No activity recorded yet.</p>
              )}
            </div>
          </SpotlightCard>
        </div>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsPage({ onLogout, onDeleteCompleted, theme = "dark" }: { onLogout: () => void; onDeleteCompleted: () => void; theme?: "dark" | "light" }) {
  const [profile, setProfile] = useState({
    name: localStorage.getItem("user_name") || "Jordan Lee",
    email: localStorage.getItem("user_email") || "jordan@edgeboard.io",
    bio: localStorage.getItem("user_bio") || "Personal Account"
  });
  const [notifs, setNotifs] = useState({ email: true, push: false, digest: true, overdue: true });
  const [dangerTarget, setDangerTarget] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("user_name", profile.name);
    localStorage.setItem("user_bio", profile.bio);
    const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    localStorage.setItem("user_initials", initials || "U");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 1000);
  };

  const isDark = theme === "dark";

  const inputCls: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    borderRadius: 8,
    color: isDark ? "#fff" : "#0f172a",
    padding: "10px 14px",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%"
  };

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 42, height: 24, borderRadius: 99, background: on ? (isDark ? "rgba(0,255,163,0.25)" : "rgba(110,0,255,0.2)") : (isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)"), border: `1px solid ${on ? (isDark ? "rgba(0,255,163,0.5)" : "rgba(110,0,255,0.4)") : (isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)")}`, position: "relative", cursor: "pointer", transition: "all 0.25s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: on ? (isDark ? "#00ffa3" : "#6e00ff") : (isDark ? "#64748b" : "#94a3b8"), position: "absolute", top: 3, left: on ? 22 : 3, transition: "all 0.25s", boxShadow: on ? (isDark ? "0 0 8px rgba(0,255,163,0.5)" : "0 0 8px rgba(110,0,255,0.4)") : "none" }} />
    </button>
  );

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <div style={{ marginBottom: 28 }}>
        <ShinyText><h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", display: "inline" }}>Settings</h1></ShinyText>
        <p style={{ color: isDark ? "#64748b" : "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <SpotlightCard className="p-6 mb-4" glowColor="#00ffa3" theme={theme}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"}` }}>Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#0b0f19", flexShrink: 0 }}>
            {localStorage.getItem("user_initials") || "U"}
          </div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: isDark ? "#fff" : "#0f172a", fontSize: 15 }}>{profile.name}</p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{profile.bio || "Personal Account"}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Display Name", key: "name",  placeholder: "Your name" },
            { label: "Email Address (Read-only)", key: "email", placeholder: "you@example.com" },
            { label: "Short Bio",    key: "bio",   placeholder: "A line about you" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isDark ? "#64748b" : "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
              <input 
                style={{ ...inputCls, ...(key === "email" ? { opacity: 0.5, cursor: "not-allowed" } : {}) }} 
                placeholder={placeholder} 
                disabled={key === "email"}
                value={(profile as Record<string, string>)[key]} 
                onChange={e => setProfile({ ...profile, [key]: e.target.value })} 
              />
            </div>
          ))}
        </div>
        <ShinyButton onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, padding: "9px 18px", borderRadius: 10, background: saved ? (isDark ? "rgba(0,255,163,0.12)" : "rgba(110,0,255,0.12)") : (isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)"), color: saved ? (isDark ? "#00ffa3" : "#6e00ff") : (isDark ? "#0b0f19" : "#fff"), border: saved ? `1px solid ${isDark ? "rgba(0,255,163,0.3)" : "rgba(110,0,255,0.3)"}` : "none", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, boxShadow: saved ? "none" : (isDark ? "0 0 20px rgba(0,255,163,0.25)" : "0 4px 14px rgba(110,0,255,0.2)"), transition: "all 0.2s" }}>
          {saved ? <><CheckCircle size={14} />Saved!</> : "Save Changes"}
        </ShinyButton>
      </SpotlightCard>

      {/* Notifications */}
      <SpotlightCard className="p-6 mb-4" glowColor="#6e00ff" theme={theme}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"}` }}>Notifications</h3>
        {[
          { key: "email",   label: "Email reminders",  desc: "Get task updates sent to your email" },
          { key: "push",    label: "Push notifications", desc: "Browser notifications for urgent items" },
          { key: "digest",  label: "Weekly summary",    desc: "A roundup every Monday morning" },
          { key: "overdue", label: "Overdue alerts",    desc: "Instant alert when a task passes its due date" },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"}` }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: isDark ? "#cbd5e1" : "#334155", fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: isDark ? "#64748b" : "#475569", marginTop: 2 }}>{desc}</p>
            </div>
            <Toggle on={(notifs as Record<string, boolean>)[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} />
          </div>
        ))}
      </SpotlightCard>

      {/* Danger zone */}
      <div style={{ background: isDark ? "rgba(244,63,94,0.05)" : "rgba(244,63,94,0.03)", border: `1px solid ${isDark ? "rgba(244,63,94,0.2)" : "rgba(244,63,94,0.15)"}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Shield size={15} style={{ color: "#f43f5e" }} />
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#f43f5e" }}>Danger Zone</h3>
        </div>
        {[
          { id: "completed", label: "Clear completed tasks", desc: "Permanently delete all tasks you've marked done.",  action: onDeleteCompleted },
          { id: "logout",    label: "Sign out",              desc: "Sign out of EdgeBoard on this device.",             action: onLogout },
        ].map(({ id, label, desc, action }) => (
          <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${isDark ? "rgba(244,63,94,0.1)" : "rgba(244,63,94,0.08)"}`, flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: isDark ? "#64748b" : "#475569", marginTop: 1 }}>{desc}</p>
            </div>
            {dangerTarget === id ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { action(); setDangerTarget(null); }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(244,63,94,0.2)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>Confirm</button>
                <button onClick={() => setDangerTarget(null)} style={{ padding: "6px 12px", borderRadius: 8, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, color: isDark ? "#64748b" : "#475569", fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>Cancel</button>
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


// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick, theme = "dark" }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void; theme?: "dark" | "light" }) {
  const isDark = theme === "dark";
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: active ? (isDark ? "rgba(0,255,163,0.1)" : "rgba(110,0,255,0.08)") : "transparent", border: active ? (isDark ? "1px solid rgba(0,255,163,0.2)" : "1px solid rgba(110,0,255,0.15)") : "1px solid transparent", color: active ? (isDark ? "#00ffa3" : "#6e00ff") : (isDark ? "#64748b" : "#475569"), cursor: "pointer", transition: "all 0.2s" }}>
      <Icon size={15} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
      {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: isDark ? "#00ffa3" : "#6e00ff", boxShadow: isDark ? "0 0 6px #00ffa3" : "0 0 6px #6e00ff" }} />}
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

function DashboardMockup({ onLogoClick }: { onLogoClick?: () => void }) {
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
            <div onClick={onLogoClick} className="cursor-pointer cursor-target" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={7} style={{ color: "#0b0f19" }} /></div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 9, background: "linear-gradient(90deg, #fff, #00ffa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "inline-block", color: "transparent" }}>EdgeBoard</span>
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

function LandingPage({ onLogin, onRegister, theme, toggleTheme, onLogoClick }: { onLogin: () => void; onRegister: () => void; theme: "dark" | "light"; toggleTheme: () => void; onLogoClick?: () => void }) {
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

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const container = document.getElementById("landing-scroll");
    const target = document.getElementById(id);
    if (container && target) {
      const offset = target.offsetTop - 30;
      setTimeout(() => {
        container.scrollTo({
          top: offset,
          behavior: "smooth"
        });
      }, 80);
    }
  };

  const isDark = theme === "dark";

  return (
    <div id="landing-scroll" className="h-screen overflow-y-auto" style={{ position: "relative", zIndex: 10 }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: scrolled ? (isDark ? "rgba(8,12,21,0.92)" : "rgba(255,255,255,0.92)") : "transparent", borderBottom: scrolled ? `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"}` : "1px solid transparent", backdropFilter: scrolled ? "blur(20px)" : "none", transition: "all 0.3s", padding: "0 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
          <div onClick={onLogoClick} className="cursor-pointer cursor-target" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 14px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={13} style={{ color: "#0b0f19" }} /></div>
            <span className="gradient-logo-text" style={{ fontSize: 16, background: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)" }}>EdgeBoard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features","How it works"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`}
                onClick={e => handleScrollTo(e, l.toLowerCase().replace(/ /g,"-"))}
                style={{ ...mono, fontSize: 9, color: "#64748b", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.12em", transition: "color 0.2s", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color=isDark ? "#cbd5e1" : "#0f172a")}
                onMouseLeave={e => (e.currentTarget.style.color="#64748b")}>
                {l}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleTheme} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.color=isDark ? "#cbd5e1" : "#0f172a"} onMouseLeave={e => e.currentTarget.style.color="#64748b"} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {isDark ? <Sun size={15} style={{ color: "#f59e0b" }} /> : <Moon size={15} style={{ color: "#6e00ff" }} />}
            </button>
            <button onClick={onLogin} style={{ ...dm, fontSize: 13, fontWeight: 600, color: isDark ? "#cbd5e1" : "#475569", background: "none", border: "none", cursor: "pointer", padding: "8px 14px" }} onMouseEnter={e => (e.currentTarget.style.color=isDark ? "#fff" : "#0f172a")} onMouseLeave={e => (e.currentTarget.style.color=isDark ? "#cbd5e1" : "#475569")}>Sign in</button>
            <ShinyButton onClick={onRegister} className="flex items-center gap-2" style={{ ...dm, fontSize: 13, fontWeight: 700, background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", border: "none", borderRadius: 8, padding: "9px 18px", boxShadow: isDark ? "0 0 20px rgba(0,255,163,0.3)" : "0 4px 14px rgba(110,0,255,0.25)" }}>
              Get started <ArrowRight size={13} />
            </ShinyButton>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8 }} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {isDark ? <Sun size={15} style={{ color: "#f59e0b" }} /> : <Moon size={15} style={{ color: "#6e00ff" }} />}
            </button>
            <button onClick={() => setMenuOpen(v => !v)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background: isDark ? "rgba(8,12,21,0.97)" : "rgba(255,255,255,0.97)", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)"}`, padding: "16px 40px 20px" }}>
            {["Features","How it works"].map(l => (
              <div key={l} style={{ padding: "10px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"}` }}>
                <a href={`#${l.toLowerCase().replace(/ /g,"-")}`}
                  onClick={e => { setMenuOpen(false); handleScrollTo(e, l.toLowerCase().replace(/ /g,"-")); }}
                  style={{ ...mono, fontSize: 10, color: "#64748b", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.12em", display: "block" }}>
                  {l}
                </a>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <button onClick={onLogin} style={{ ...dm, fontSize: 14, fontWeight: 600, color: isDark ? "#cbd5e1" : "#475569", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`, borderRadius: 8, padding: "12px", cursor: "pointer" }}>Sign in</button>
              <ShinyButton onClick={onRegister} className="w-full text-center" style={{ ...dm, fontSize: 14, fontWeight: 700, background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", border: "none", borderRadius: 8, padding: "12px" }}>Get started free</ShinyButton>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px 100px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: isDark ? "radial-gradient(ellipse, rgba(0,255,163,0.07) 0%, transparent 70%)" : "radial-gradient(ellipse, rgba(110,0,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 200, left: "5%", width: 280, height: 280, background: "radial-gradient(ellipse, rgba(110,0,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <h1 style={{ ...syne, fontWeight: 800, fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1.05, letterSpacing: "-2px", color: isDark ? "#fff" : "#0f172a", marginBottom: 22, maxWidth: 760, margin: "0 auto 22px" }}>
          <SplitText text="One place for" delay={30} /><br />
          <BlurText text="everything you're working on." delay={55} shiny={true} />
        </h1>

        <p style={{ ...dm, fontSize: "clamp(14px, 2vw, 17px)", color: isDark ? "#64748b" : "#475569", lineHeight: 1.75, maxWidth: 480, margin: "0 auto 36px" }}>
          <BlurText text="Tasks across work, health, learning, finances, and life — all in a single dark, fast, beautifully minimal board built for one person: you." delay={20} />
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <ShinyButton onClick={onRegister} className="flex items-center gap-2" style={{ ...dm, fontSize: 15, fontWeight: 700, background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", border: "none", borderRadius: 10, padding: "13px 26px", boxShadow: isDark ? "0 0 30px rgba(0,255,163,0.35)" : "0 4px 18px rgba(110,0,255,0.3)" }}>
            Start for free <ArrowRight size={15} />
          </ShinyButton>
          <button onClick={onLogin} style={{ ...dm, fontSize: 15, fontWeight: 600, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)", color: isDark ? "#cbd5e1" : "#334155", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`, borderRadius: 10, padding: "13px 26px", cursor: "pointer" }}>Sign in</button>
        </div>

        <div style={{ marginTop: 60 }}>
          <FadeContent delay={200}>
            <DashboardMockup onLogoClick={onLogoClick} />
          </FadeContent>
        </div>
      </section>

      {/* Ticker */}
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}`, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}`, padding: "16px 0", overflow: "hidden", background: isDark ? "rgba(255,255,255,0.015)" : "rgba(15,23,42,0.015)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 60, whiteSpace: "nowrap", animation: "ticker 18s linear infinite" }}>
          {["WORK", "PERSONAL", "HEALTH", "LEARNING", "FINANCE", "CREATIVE", "GOALS", "HABITS", "PROJECTS", "FOCUS", "WORK", "PERSONAL", "HEALTH", "LEARNING", "FINANCE", "CREATIVE", "GOALS", "HABITS"].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: isDark ? "rgba(0,255,163,0.4)" : "rgba(110,0,255,0.3)" }} />
              <span style={{ ...mono, fontSize: 10, color: isDark ? "#374151" : "#94a3b8", letterSpacing: "0.2em" }}>{w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 4vw, 42px)", letterSpacing: "-1.5px", color: isDark ? "#fff" : "#0f172a", marginBottom: 12 }}>Built around your life, not a team</h2>
          <p style={{ ...dm, fontSize: 14, color: isDark ? "#64748b" : "#475569", maxWidth: 420, margin: "0 auto" }}>Just a clean, personal space to stay on top of things.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {FEATURES.map(({ icon: Icon, title, body, color }, idx) => (
            <FadeContent key={title} delay={idx * 85}>
              <SpotlightCard className="p-6" glowColor={color} theme={theme}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <h3 style={{ ...syne, fontWeight: 800, fontSize: 14, color: isDark ? "#fff" : "#0f172a", marginBottom: 7 }}>{title}</h3>
                <p style={{ ...dm, fontSize: 13, color: isDark ? "#64748b" : "#475569", lineHeight: 1.65 }}>{body}</p>
              </SpotlightCard>
            </FadeContent>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 4vw, 42px)", letterSpacing: "-1.5px", color: isDark ? "#fff" : "#0f172a", marginBottom: 12 }}>Simple by design</h2>
          <p style={{ ...dm, fontSize: 14, color: isDark ? "#64748b" : "#475569", maxWidth: 400, margin: "0 auto" }}>Open EdgeBoard, add your tasks, and start moving.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, position: "relative" }}>
          <div className="hidden lg:block" style={{ position: "absolute", top: 40, left: "16.67%", right: "16.67%", height: 1, background: isDark ? "linear-gradient(90deg, transparent, rgba(0,255,163,0.2) 20%, rgba(0,255,163,0.2) 80%, transparent)" : "linear-gradient(90deg, transparent, rgba(110,0,255,0.15) 20%, rgba(110,0,255,0.15) 80%, transparent)" }} />
          {[
            { n: "01", title: "Add your tasks",       body: "Create tasks for anything — a workout, a book, a work deadline. Pick a category, set a due date, and add any notes you need." },
            { n: "02", title: "Organise by category",  body: "Work tasks live separately from your health goals and finance to-dos. Filter or view them all together — your call." },
            { n: "03", title: "Track and finish",      body: "Move tasks from pending to done, monitor your momentum in analytics, and build the habit of consistently following through." },
          ].map(({ n, title, body }, idx) => (
            <div key={n} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <FadeContent delay={idx * 150}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: isDark ? "rgba(0,255,163,0.07)" : "rgba(110,0,255,0.05)", border: `1px solid ${isDark ? "rgba(0,255,163,0.22)" : "rgba(110,0,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: isDark ? "0 0 20px rgba(0,255,163,0.08)" : "0 4px 12px rgba(110,0,255,0.06)" }}>
                  <span style={{ ...syne, fontWeight: 800, fontSize: 17, color: isDark ? "#00ffa3" : "#6e00ff" }}>{n}</span>
                </div>
                <h3 style={{ ...syne, fontWeight: 800, fontSize: 15, color: isDark ? "#fff" : "#0f172a", marginBottom: 9 }}>{title}</h3>
                <p style={{ ...dm, fontSize: 13, color: isDark ? "#64748b" : "#475569", lineHeight: 1.65, maxWidth: 240, margin: "0 auto" }}>{body}</p>
              </FadeContent>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 40px" }}>
        <div style={{ borderRadius: 22, padding: "60px 44px", textAlign: "center", background: isDark ? "rgba(0,255,163,0.03)" : "rgba(110,0,255,0.02)", border: `1px solid ${isDark ? "rgba(0,255,163,0.14)" : "rgba(110,0,255,0.12)"}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: isDark ? "radial-gradient(ellipse, rgba(0,255,163,0.1) 0%, transparent 70%)" : "radial-gradient(ellipse, rgba(110,0,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(26px, 5vw, 50px)", letterSpacing: "-2px", color: isDark ? "#fff" : "#0f172a", marginBottom: 14 }}>
              Start today. <ShinyText>Stay on edge.</ShinyText>
            </h2>
            <p style={{ ...dm, fontSize: 16, color: isDark ? "#64748b" : "#475569", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.65 }}>
              Everything you're working on — in one place that actually looks good.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <ShinyButton onClick={onRegister} className="flex items-center gap-2" style={{ ...dm, fontSize: 15, fontWeight: 700, background: isDark ? "linear-gradient(135deg, #00ffa3, #00cc82)" : "linear-gradient(135deg, #6e00ff, #5700d1)", color: isDark ? "#0b0f19" : "#fff", border: "none", borderRadius: 10, padding: "13px 26px", boxShadow: isDark ? "0 0 36px rgba(0,255,163,0.4)" : "0 4px 18px rgba(110,0,255,0.3)" }}>
                Create free account <ArrowRight size={15} />
              </ShinyButton>
              <button onClick={onLogin} style={{ ...dm, fontSize: 15, fontWeight: 600, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)", color: isDark ? "#cbd5e1" : "#334155", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`, borderRadius: 10, padding: "13px 26px", cursor: "pointer" }}>Sign in</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}`, padding: "36px 40px", background: isDark ? "rgba(8,12,21,0.5)" : "rgba(248,250,252,0.5)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div onClick={onLogoClick} className="cursor-pointer cursor-target" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={11} style={{ color: "#0b0f19" }} /></div>
              <span className="gradient-logo-text" style={{ fontSize: 14, background: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)" }}>EdgeBoard</span>
            </div>
            <p style={{ ...dm, fontSize: 12, color: isDark ? "#374151" : "#475569", maxWidth: 200, lineHeight: 1.6 }}>A personal task manager for people who want to get things done.</p>
          </div>
          {[
            { title: "Product", links: ["Features","Pricing","Changelog"] },
            { title: "Legal",   links: ["Privacy","Terms","Cookies"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p style={{ ...mono, fontSize: 9, color: isDark ? "#374151" : "#475569", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {links.map(l => <span key={l} style={{ ...dm, fontSize: 12, color: "#64748b", cursor: "pointer" }}>{l}</span>)}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("app_theme") as "dark" | "light") || "dark";
  });

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("app_theme", nextTheme);
  }, [theme]);

  const isDark = theme === "dark";

  // Dynamic CSS variables injector to dynamically shift colors
  useEffect(() => {
    document.body.style.backgroundColor = isDark ? "#0b0f19" : "#f8fafc";
    document.body.style.color = isDark ? "#ffffff" : "#0f172a";
    
    // Inject custom scrollbar and theme overrides depending on mode
    const styleEl = document.getElementById("theme-scrollbar-styles") || document.createElement("style");
    styleEl.id = "theme-scrollbar-styles";
    styleEl.textContent = `
      :root {
        --logo-gradient: ${isDark ? "linear-gradient(90deg, #fff 0%, #00ffa3 100%)" : "linear-gradient(90deg, #0f172a 0%, #6e00ff 100%)"};
      }
      ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.15)"}; }
      ::-webkit-scrollbar-thumb:hover { background: ${isDark ? "rgba(0,255,163,0.3)" : "rgba(110,0,255,0.35)"}; }
      input, textarea, select {
        color: ${isDark ? "#ffffff" : "#0f172a"} !important;
        background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)"} !important;
        border-color: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"} !important;
      }
      select option {
        background: ${isDark ? "#0f1526" : "#ffffff"} !important;
        color: ${isDark ? "#ffffff" : "#0f172a"} !important;
      }
    `;
    if (!styleEl.parentElement) {
      document.head.appendChild(styleEl);
    }
  }, [theme, isDark]);

  const colors = {
    bg: isDark ? "#0b0f19" : "#f8fafc",
    cardBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    text: isDark ? "#ffffff" : "#0f172a",
    subtext: isDark ? "#64748b" : "#475569",
    sidebarBg: isDark ? "rgba(8,12,21,0.92)" : "rgba(255,255,255,0.95)",
    inputBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    inputText: isDark ? "#ffffff" : "#0f172a",
    badgeBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)",
    activeNavBg: isDark ? "rgba(0,255,163,0.1)" : "rgba(110,0,255,0.08)",
    activeNavBorder: isDark ? "1px solid rgba(0,255,163,0.2)" : "1px solid rgba(110,0,255,0.15)",
    activeNavText: isDark ? "#00ffa3" : "#6e00ff",
    logoText: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)",
    accent: isDark ? "#00ffa3" : "#00aa6c",
  };

  const [appState, setAppState] = useState<AppState>("landing");
  const [page,     setPage]     = useState<AppPage>("board");
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [modalTask, setModalTask] = useState<Task | "new" | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigateToPage = (p: AppPage) => {
    setPage(p);
    setMobileSidebarOpen(false);
  };

  const handleLogoClick = useCallback(() => {
    if (appState === "app") {
      if (page !== "board") {
        setPage("board");
      } else {
        setAppState("landing");
      }
    } else {
      setAppState("landing");
    }
  }, [appState, page]);

  // Check login session on mount (including Google OAuth redirect hash parameters)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      
      const processGoogleLogin = async () => {
        try {
          let email = "";
          let name = "";
          
          if (accessToken === "mock_google_token") {
            email = params.get("email") || "jordan@colledge.in";
            name = params.get("name") || "Jordan Lee";
          } else {
            const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            if (response.ok) {
              const data = await response.json();
              email = data.email;
              name = data.name || data.given_name || email.split("@")[0];
            } else {
              throw new Error("Failed to validate Google token");
            }
          }
          
          if (email) {
            localStorage.setItem("user_email", email);
            localStorage.setItem("user_name", name);
            const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
            localStorage.setItem("user_initials", initials || "U");
            
            window.history.replaceState(null, "", window.location.pathname);
            setAppState("app");
          }
        } catch (error) {
          console.error("Error parsing Google OAuth redirect hash:", error);
          window.history.replaceState(null, "", window.location.pathname);
        }
      };
      
      processGoogleLogin();
    } else {
      const savedEmail = localStorage.getItem("user_email");
      if (savedEmail) {
        setAppState("app");
      }
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

  const handleStatusChange = useCallback(async (id: string, status: Status) => {
    try {
      let timerStartedAtUpdate = "";
      let timeTrackedUpdate = 0;

      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const now = new Date();
          let newTimeTracked = t.timeTracked || 0;
          let newTimerStartedAt = t.timerStartedAt || "";

          if (status === "in-progress" && t.status !== "in-progress") {
            newTimerStartedAt = now.toISOString();
          } else if (t.status === "in-progress" && status !== "in-progress") {
            if (t.timerStartedAt) {
              const elapsed = now.getTime() - new Date(t.timerStartedAt).getTime();
              if (elapsed > 0) {
                newTimeTracked += elapsed;
              }
            }
            newTimerStartedAt = "";
          }

          timerStartedAtUpdate = newTimerStartedAt;
          timeTrackedUpdate = newTimeTracked;

          return { ...t, status, timeTracked: newTimeTracked, timerStartedAt: newTimerStartedAt };
        }
        return t;
      }));

      setDrawerTask(prev => {
        if (prev?.id === id) {
          return {
            ...prev,
            status,
            timeTracked: timeTrackedUpdate,
            timerStartedAt: timerStartedAtUpdate
          };
        }
        return prev;
      });

      await taskService.updateTask(id, {
        status,
        timeTracked: timeTrackedUpdate,
        timerStartedAt: timerStartedAtUpdate
      });
    } catch (err) {
      console.error("Failed to update status on DB:", err);
    }
  }, []);

  const handleSaveTask = useCallback(async (task: Task) => {
    try {
      const isExisting = tasks.some(t => t.id === task.id);
      if (isExisting) {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        await taskService.updateTask(task.id, {
          title: task.title,
          category: task.category,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          tags: task.tags,
          activity: task.activity,
          timeTracked: task.timeTracked || 0,
          timerStartedAt: task.timerStartedAt || ""
        });
      } else {
        const created = await taskService.createTask({
          title: task.title,
          category: task.category,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          tags: task.tags,
          activity: task.activity,
          timeTracked: 0,
          timerStartedAt: ""
        });
        setTasks(prev => [created, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save task to DB:", err);
    }
  }, [tasks]);

  const handleDeleteCompleted = useCallback(async () => {
    try {
      const completedTasks = tasks.filter(t => t.status === "completed");
      setTasks(prev => prev.filter(t => t.status !== "completed"));
      
      for (const t of completedTasks) {
        await taskService.deleteTask(t.id);
      }
    } catch (err) {
      console.error("Failed to delete completed tasks:", err);
    }
  }, [tasks]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_initials");
    setAppState("landing");
  }, []);

  const openEdit = (t: Task) => { setDrawerTask(null); setModalTask(t); };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <GridBackground theme={theme} />

      <div className={`relative z-10 min-h-screen ${theme}`} style={{ fontFamily: "'DM Sans', sans-serif", color: colors.text }}>
        {appState === "landing"  && (
          <LandingPage 
            onLogin={() => {
              if (localStorage.getItem("user_email")) {
                setAppState("app");
              } else {
                setAppState("login");
              }
            }} 
            onRegister={() => {
              if (localStorage.getItem("user_email")) {
                setAppState("app");
              } else {
                setAppState("register");
              }
            }} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onLogoClick={handleLogoClick} 
          />
        )}
        {appState === "login"    && <LoginPage    onLogin={() => setAppState("app")}  onGoRegister={() => setAppState("register")} theme={theme} onLogoClick={handleLogoClick} />}
        {appState === "register" && <RegisterPage onRegister={() => setAppState("app")} onGoLogin={() => setAppState("login")} theme={theme} onLogoClick={handleLogoClick} />}

        {appState === "app" && (
          <div className="flex h-screen overflow-hidden relative">
            {/* Sidebar backdrop overlay on mobile */}
            {mobileSidebarOpen && (
              <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`w-52 shrink-0 flex flex-col h-full dashboard-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`} style={{ background: colors.sidebarBg, borderRight: `1px solid ${colors.border}`, backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "22px 18px 14px" }}>
                <div onClick={handleLogoClick} className="cursor-pointer cursor-target" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", boxShadow: "0 0 12px rgba(0,255,163,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={12} style={{ color: "#0b0f19" }} />
                  </div>
                  <span className="gradient-logo-text" style={{ fontSize: 15, background: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)" }}>EdgeBoard</span>
                </div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: colors.subtext, textTransform: "uppercase", letterSpacing: "0.15em", marginLeft: 34 }}>Personal</p>
              </div>

              <nav style={{ flex: 1, padding: "0 9px", display: "flex", flexDirection: "column", gap: 2 }}>
                <NavItem icon={LayoutGrid} label="My Tasks"  active={page === "board"}     onClick={() => navigateToPage("board")} theme={theme} />
                <NavItem icon={BarChart2}  label="Overview"  active={page === "stats"}     onClick={() => navigateToPage("stats")} theme={theme} />
                <NavItem icon={PieChart}   label="Analytics" active={page === "analytics"} onClick={() => navigateToPage("analytics")} theme={theme} />
                <NavItem icon={Settings}   label="Settings"  active={page === "settings"}  onClick={() => navigateToPage("settings")} theme={theme} />
              </nav>

              <div style={{ padding: "10px 9px 14px" }}>
                {/* Theme Toggle Button */}
                <button onClick={toggleTheme} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "transparent", border: "1px solid transparent", color: colors.subtext, cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }} onMouseEnter={e => e.currentTarget.style.background=isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  {isDark ? <Sun size={14} style={{ color: "#f59e0b" }} /> : <Moon size={14} style={{ color: "#6e00ff" }} />}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }}>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 10, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#0b0f19", flexShrink: 0 }}>
                    {localStorage.getItem("user_initials") || "AR"}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: colors.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {localStorage.getItem("user_name") || "Alex Rivera"}
                    </p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: colors.subtext, textTransform: "uppercase", letterSpacing: "0.08em" }}>Free plan</p>
                  </div>
                  <button onClick={handleLogout} style={{ color: colors.subtext, background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Sign out"><LogOut size={12} /></button>
                </div>
              </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Mobile top header bar */}
              <div className="mobile-header flex items-center justify-between p-4 md:hidden" style={{ background: colors.sidebarBg, borderBottom: `1px solid ${colors.border}` }}>
                <button onClick={() => setMobileSidebarOpen(true)} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", display: "flex", alignItems: "center" }} title="Open menu">
                  <Menu size={20} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, #00ffa3, #6e00ff)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={10} style={{ color: "#0b0f19" }} /></div>
                  <span className="gradient-logo-text" style={{ fontSize: 13, background: isDark ? "linear-gradient(90deg, #fff, #00ffa3)" : "linear-gradient(90deg, #0f172a, #6e00ff)" }}>EdgeBoard</span>
                </div>
                <button onClick={toggleTheme} style={{ background: "none", border: "none", color: colors.subtext, cursor: "pointer", display: "flex", alignItems: "center" }} title="Toggle theme">
                  {isDark ? <Sun size={15} style={{ color: "#f59e0b" }} /> : <Moon size={15} style={{ color: "#6e00ff" }} />}
                </button>
              </div>

              {/* Main */}
              <main className="flex-1 overflow-y-auto p-8 main-content">
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                    <Spinner />
                  </div>
                ) : (
                  <>
                    {page === "board"     && <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} onOpenCreate={() => setModalTask("new")} onOpenEdit={openEdit} onOpenDetail={t => setDrawerTask(t)} theme={theme} />}
                    {page === "stats"     && <DashboardStats tasks={tasks} theme={theme} />}
                    {page === "analytics" && <AnalyticsPage  tasks={tasks} theme={theme} />}
                    {page === "settings"  && <SettingsPage   onLogout={handleLogout} onDeleteCompleted={handleDeleteCompleted} theme={theme} />}
                  </>
                )}
              </main>
            </div>
          </div>
        )}
      </div>

      {modalTask !== null && (
        <TaskModal initial={modalTask === "new" ? undefined : modalTask} onClose={() => setModalTask(null)} onSave={handleSaveTask} theme={theme} />
      )}

      {drawerTask && (
        <TaskDrawer task={drawerTask} onClose={() => setDrawerTask(null)} onEdit={() => openEdit(drawerTask)} onStatusChange={(id, s) => { handleStatusChange(id, s); setDrawerTask(prev => prev ? { ...prev, status: s } : prev); }} onSave={updatedTask => { handleSaveTask(updatedTask); setDrawerTask(updatedTask); }} theme={theme} />
      )}

      <TargetCursor
        targetSelector=".cursor-target, button, a"
        spinDuration={2}
        hideDefaultCursor={true}
        hoverDuration={0.2}
        parallaxOn={true}
        cursorColor={isDark ? "#00ffa3" : "#6e00ff"}
        cursorColorOnTarget={isDark ? "#ffffff" : "#0f172a"}
      />
    </>
  );
}

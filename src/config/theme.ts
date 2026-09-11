import { StatusType } from "@/types/declaration";

// ─── Brand tokens ───────────────────────────────────────────────────────────────
export const TEAL     = "#0D9488";
export const TEAL_DARK= "#0F766E";
export const ORANGE   = "#F97316";
export const ORANGE_LIGHT = "#FF8F00";
export const DARKEST  = "#1a0a3a";
export const TEAL_600 = "#14B8A6";
export const F        = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

// Legacy aliases (kept so existing screens compile; mapped onto travel palette)
export const PURPLE     = TEAL;
export const DEEP       = TEAL_DARK;
export const YELLOW     = ORANGE;
export const PURPLE_600 = TEAL_600;

// ─── Common gradient strings (for inline style={{ background: ... }}) ──────────
export const GRADIENT_PRIMARY = `linear-gradient(135deg, ${TEAL}, ${TEAL_600})`;
export const GRADIENT_ACCENT = `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`;
export const GRADIENT_SIDEBAR = `linear-gradient(180deg, ${DARKEST} 0%, ${TEAL_DARK} 100%)`;
export const GRADIENT_LANDING = `linear-gradient(145deg, ${DARKEST} 0%, ${TEAL_DARK} 35%, ${TEAL} 70%, ${TEAL_600} 100%)`;

// ─── Shared background colours ──────────────────────────────────────────────────
export const TABLE_HEADER_BG = "#EFF6FF";
export const INFO_BG        = "#DCFCE7";
export const DEFAULT_HIGH_VALUE_THRESHOLD = 5000;
export const DEFAULT_MEDIUM_VALUE_THRESHOLD = 1000;
export const DEFAULT_MAXIMUM_VALUE = 100000;

// ─── Declaration type chart colours (shared by dashboard charts) ────────────────
export const TYPE_COLORS: Record<string, string> = {
  Business:      "#0D9488",
  Leisure:       "#F97316",
  Visiting:      "#10B981",
  Other:         "#6B7280",
  Domestic:      "#0D9488",
  International: "#F97316",
};

// ─── Type badge colours ─────────────────────────────────────────────────────────
export const typeCfg: Record<string, { bg: string; text: string }> = {
  Business:      { bg: "#ECFDF9", text: "#0D9488" },
  Leisure:       { bg: "#FFFBF0", text: "#F97316" },
  Visiting:      { bg: "#D1F9C4", text: "#10B981" },
  Other:         { bg: "#F3F4F6", text: "#6B7280" },
  Domestic:      { bg: "#ECFDF9", text: "#0D9488" },
  International: { bg: "#FFF3E8", text: "#F97316" },
};

// ─── Status colours — single source of truth ────────────────────────────────────
//         bg / text / ring = Tailwind classes for StatusBadge
//         hex              = hex colour for KPI cards, icons, gradients
//         dot / rail       = Tailwind classes for WorkflowTimeline
export const STATUS_COLORS: Record<StatusType, { bg: string; text: string; ring: string; hex: string; dot: string; rail: string }> = {
  Draft:            { bg: "bg-slate-100",  text: "text-slate-600",   ring: "bg-slate-400", hex: "#94a3b8", dot: "bg-slate-400", rail: "bg-slate-300" },
  Pending:          { bg: "bg-amber-50",   text: "text-amber-700",   ring: "bg-amber-400", hex: "#f59e0b", dot: "bg-amber-500", rail: "bg-amber-300" },
  Approved:         { bg: "bg-emerald-50", text: "text-emerald-700", ring: "bg-emerald-500", hex: "#10b981", dot: "bg-emerald-500", rail: "bg-emerald-300" },
  Declined:         { bg: "bg-red-50",     text: "text-red-700",     ring: "bg-red-500", hex: "#ef4444", dot: "bg-red-500", rail: "bg-red-300" },
  Escalated:        { bg: "bg-orange-50",  text: "text-orange-700",  ring: "bg-orange-500", hex: "#f97316", dot: "bg-orange-500", rail: "bg-orange-300" },
  Returned:         { bg: "bg-sky-50",     text: "text-sky-700",     ring: "bg-sky-500", hex: "#06b6d4", dot: "bg-sky-500", rail: "bg-sky-300" },
};

// ─── Decision labels (shared by WorkflowTimeline & useWorkflowApproval) ────────
export const DECISION_LABELS: Record<string, string> = {
  return: "Returned - Team member to provide additional information.",
  accept: "Approved - Team member travel request approved.",
  org: "Approved - Travel request approved and shared with the organisation pool.",
  foundation: "Approved - Travel request approved.",
  decline: "Declined - Travel request declined.",
};

export const APPROVAL_OPTIONS = [
  { value: "return",     label: "Return - Team member to provide additional information." },
  { value: "accept",     label: "Approved - Team member travel request approved." },
  { value: "org",        label: "Approved - Travel request approved and shared with the organisation pool." },
  { value: "foundation", label: "Approved - Travel request approved." },
  { value: "decline",    label: "Declined - Travel request declined." },
];

// ─── Helper: map decision label text → StatusType ──────────────────────────────
export function labelToStatus(label: string): StatusType {
  if (label.startsWith("Declined")) return "Declined";
  if (label.startsWith("Returned")) return "Returned";
  return "Approved";
}

// ─── Priority colours ──────────────────────────────────────────────────────────
export const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  High:   { bg: "bg-red-50",   text: "text-red-700" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700" },
  Low:    { bg: "bg-emerald-50", text: "text-emerald-700" },
};

// ─── Formatters ─────────────────────────────────────────────────────────────────
export function formatRand(v: number) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "R 0.00";
  return `R ${v.toLocaleString("en-ZA")}`;
}

// ─── Shared input class strings ─────────────────────────────────────────────────
export const inp =
  "w-full h-11 rounded-xl px-4 text-sm border border-slate-200 bg-slate-50 text-foreground focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white hover:border-teal-300 transition-all duration-200 ease-out placeholder:text-muted-foreground/50";

export const sel = `${inp} appearance-none pr-10 cursor-pointer bg-white border-slate-200 hover:bg-teal-50 hover:border-teal-400 hover:text-[15.5px] hover:font-semibold hover:text-teal-900 focus:bg-white focus:border-teal-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_14px_rgba(13,148,136,0.12)] transition-all duration-300`;

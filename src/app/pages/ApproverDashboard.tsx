import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckSquare, Coins, FileText } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fetchDeclarations } from "@/services/api";
import { Declaration, Screen } from "@/types/declaration";
import { ORANGE, PURPLE, GRADIENT_PRIMARY, TYPE_COLORS, formatRand, PRIORITY_COLORS } from "@/config/theme";
import { useUser } from "@/app/auth/UserContext";
import { PageHeader } from "@/app/components/PageHeader";
import { KpiCard, STATUS_KPI } from "@/app/components/KpiCard";
import { StatusBadge } from "@/app/components/StatusBadge";

function Panel({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-[0_4px_24px_rgba(79,29,149,0.06)]" style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}><h2 className="border-b border-purple-100 px-5 py-4 text-sm font-bold uppercase tracking-wide text-[#35138D]">{title}</h2>{children}</section>; }

export function ApproverDashboard({ onNavigate, onReview }: { onNavigate: (s: Screen) => void; onReview?: (d: Declaration) => void }) {
  const { user } = useUser();
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchDeclarations().then(setDeclarations).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const scoped = useMemo(() => user?.role === "teamMember" ? declarations.filter((d) => d.employeeId === user.id) : declarations, [declarations, user]);
  const pending = scoped.filter((d) => ["Pending", "Escalated"].includes(d.status));
  const stats = { pending: pending.length, approved: scoped.filter((d) => d.status === "Approved").length, returned: scoped.filter((d) => d.status === "Returned").length, declined: scoped.filter((d) => d.status === "Declined").length };
  const activity = useMemo(() => Array.from(new Set(scoped.map((d) => d.employee))).map((name) => { const rows = scoped.filter((d) => d.employee === name); return { name, trips: rows.length, spend: rows.reduce((s, d) => s + d.value, 0), approved: rows.filter((d) => d.status === "Approved").length, declined: rows.filter((d) => d.status === "Declined").length }; }).sort((a, b) => b.spend - a.spend).slice(0, 5), [scoped]);
  const typeData = useMemo(() => Object.entries(scoped.reduce<Record<string, number>>((a, d) => { a[d.type] = (a[d.type] || 0) + 1; return a; }, {})).map(([name, value]) => ({ name, value, color: TYPE_COLORS[name] || PURPLE })), [scoped]);
  const overdue = pending.filter((d) => Date.now() - new Date(d.submitted).getTime() > 7 * 86400000);
  const departments = useMemo(() => Array.from(new Set(scoped.map((d) => d.department))).map((name) => { const rows = scoped.filter((d) => d.department === name); return { name, total: rows.length, pending: rows.filter((d) => ["Pending", "Escalated"].includes(d.status)).length, approved: rows.filter((d) => d.status === "Approved").length, declined: rows.filter((d) => d.status === "Declined").length, value: rows.reduce((s, d) => s + d.value, 0) }; }).sort((a, b) => b.value - a.value), [scoped]);
  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading dashboard…</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Failed to load dashboard: {error}</div>;
  return <div className="space-y-6">
    <PageHeader title="Approver Dashboard" subtitle="Inception to Date" actions={<button type="button" onClick={() => onNavigate("approval-queue")} className="flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white" style={{ background: GRADIENT_PRIMARY }}><CheckSquare size={15} /> Approval Queue <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ background: ORANGE, color: "#1E1E2D" }}>{pending.length}</span></button>} />
    <div className="grid grid-cols-1 gap-[clamp(.75rem,1.5vw,1.25rem)] sm:grid-cols-2 xl:grid-cols-5"><KpiCard label="Pending Queue" value={String(stats.pending)} icon={STATUS_KPI.Pending.icon} decorKey="Pending" onClick={() => onNavigate("approval-queue")} /><KpiCard label="Approved" value={String(stats.approved)} icon={STATUS_KPI.Approved.icon} decorKey="Approved" /><KpiCard label="Returned" value={String(stats.returned)} icon={STATUS_KPI.Returned.icon} decorKey="Returned" /><KpiCard label="Declined" value={String(stats.declined)} icon={STATUS_KPI.Declined.icon} decorKey="Declined" /><KpiCard label="Total Value" value={formatRand(scoped.filter((d) => ["Pending", "Approved"].includes(d.status)).reduce((s, d) => s + d.value, 0))} icon={Coins} decorKey="Total Value" /></div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Panel title="Team Member Activity" accent={PURPLE}><div className="grid grid-cols-[1.4fr_.8fr_.8fr] gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-bold uppercase text-[#5D6371]"><span>Team Member</span><span>Approved</span><span>Declined</span></div>{activity.length ? activity.map((row) => <div key={row.name} className="grid grid-cols-[1.4fr_.8fr_.8fr] items-center gap-2 border-b border-slate-100 px-4 py-3 text-xs"><div><p className="font-semibold">{row.name}</p><p className="text-[10px] text-[#35138D]">{formatRand(row.spend)} · {row.trips} trips</p></div><span className="text-emerald-700">{row.approved}</span><span className="text-red-700">{row.declined}</span></div>) : <Empty message="No activity available." />}</Panel>
      <Panel title="Travel Type Distribution" accent={PURPLE}><div className="h-56"><ResponsiveContainer><PieChart><Pie data={typeData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82}>{typeData.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-2 px-3 pb-4">{typeData.map((d) => <span key={d.name} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold">{d.name}: {d.value}</span>)}</div></Panel>
      <Panel title="Overdue 7+ Days" accent="#EF4444">{overdue.length ? overdue.slice(0, 5).map((d) => <button type="button" key={d.id} onClick={() => onReview?.(d)} className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-red-50"><div><p className="font-mono text-xs font-bold text-[#35138D]">{d.id}</p><p className="text-xs">{d.employee} · {d.destination || d.to}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${PRIORITY_COLORS[d.priority].bg} ${PRIORITY_COLORS[d.priority].text}`}>{d.priority}</span></button>) : <Empty message="No overdue declarations." />}</Panel>
    </div>
    <Panel title="Department Insights"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-[#35138D] text-left text-white"><th className="px-4 py-2">Department</th><th className="px-4 py-2">Declarations</th><th className="px-4 py-2">Pending</th><th className="px-4 py-2">Approved</th><th className="px-4 py-2">Declined</th><th className="px-4 py-2">Total Value</th></tr></thead><tbody>{departments.map((d) => <tr key={d.name} className="border-b border-slate-100"><td className="px-4 py-2 font-semibold">{d.name}</td><td className="px-4 py-2">{d.total}</td><td className="px-4 py-2 text-amber-700">{d.pending}</td><td className="px-4 py-2 text-emerald-700">{d.approved}</td><td className="px-4 py-2 text-red-700">{d.declined}</td><td className="px-4 py-2 font-semibold">{formatRand(d.value)}</td></tr>)}</tbody></table></div></Panel>
  </div>;
}

function Empty({ message }: { message: string }) { return <p className="px-4 py-10 text-center text-xs text-[#5D6371]">{message}</p>; }

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckSquare, Clock, RefreshCw } from "lucide-react";
import { fetchConfig, fetchDeclarations, fetchPendingWorkflows, fetchWorkflowInstance } from "@/services/api";
import { Declaration, Screen } from "@/types/declaration";
import { ORANGE, GRADIENT_PRIMARY, formatRand } from "@/config/theme";
import { useUser } from "@/app/auth/UserContext";
import { PageHeader } from "@/app/components/PageHeader";
import { KpiCard, STATUS_KPI } from "@/app/components/KpiCard";
import { StatusBadge } from "@/app/components/StatusBadge";

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-md border border-[#E4E7ED] bg-white"><div className="flex items-center justify-between border-b border-[#E4E7ED] px-4 py-3"><h2 className="text-xs font-extrabold uppercase text-[#35138D]">{title}</h2>{action}</div>{children}</section>;
}

export function ApproverDashboard({ onNavigate, onReview }: { onNavigate: (s: Screen) => void; onReview?: (d: Declaration) => void }) {
  const { user } = useUser();
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [assignedPending, setAssignedPending] = useState<{ declaration: Declaration; step: import("@/types/declaration").WorkflowStep | null }[]>([]);
  const [decisionDates, setDecisionDates] = useState<Record<string, string>>({});
  const [slaDays, setSlaDays] = useState(7);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setError(null);
    try {
      const [all, workflows, config] = await Promise.all([fetchDeclarations(), fetchPendingWorkflows(), fetchConfig()]);
      setDeclarations(all);
      setSlaDays(config.slaEscalationDays || 7);
      const visible = user?.role === "admin" ? workflows : workflows.filter((item) => item.step?.assignee === user?.id);
      setAssignedPending(visible);
      const terminal = all.filter((d) => ["Approved", "Declined", "Returned"].includes(d.status));
      const instances = await Promise.all(terminal.map((d) => fetchWorkflowInstance(d.id)));
      const dates: Record<string, string> = {};
      instances.forEach((instance) => instance.steps.forEach((step) => { if (step.decidedAt && (!dates[instance.declarationId] || step.decidedAt > dates[instance.declarationId])) dates[instance.declarationId] = step.decidedAt; }));
      setDecisionDates(dates);
      setLastUpdated(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load dashboard"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const scoped = useMemo(() => user?.role === "admin" ? declarations : declarations.filter((d) => assignedPending.some((item) => item.declaration.id === d.id) || d.employeeId === user?.id), [declarations, assignedPending, user]);
  const pending = useMemo(() => assignedPending.filter((item) => item.step).map((item) => item.declaration).sort((a, b) => a.submitted.localeCompare(b.submitted)), [assignedPending]);
  const overdue = useMemo(() => assignedPending.filter((item) => item.step && Date.now() - new Date(item.declaration.submitted).getTime() > slaDays * 86400000).map((item) => item.declaration), [assignedPending, slaDays]);
  const recent = useMemo(() => scoped.filter((d) => ["Approved", "Declined", "Returned"].includes(d.status)).sort((a, b) => (decisionDates[b.id] || b.submitted).localeCompare(decisionDates[a.id] || a.submitted)).slice(0, 6), [scoped, decisionDates]);
  const stats = { pending: pending.length, approved: scoped.filter((d) => d.status === "Approved").length, returned: scoped.filter((d) => d.status === "Returned").length, declined: scoped.filter((d) => d.status === "Declined").length };
  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading approval dashboard…</div>;
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700"><strong>Failed to load dashboard:</strong> {error}<button type="button" onClick={load} className="ml-3 underline">Retry</button></div>;
  return <div className="space-y-5">
    <PageHeader title="Approver Dashboard" subtitle="Approval workload and items requiring attention" actions={<div className="flex items-center gap-3"><span className="hidden text-[10px] text-[#5D6371] sm:inline">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><button type="button" onClick={() => onNavigate("approval-queue")} className="flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white" style={{ background: GRADIENT_PRIMARY }}><CheckSquare size={15} /> Approval Queue <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ background: ORANGE, color: "#1E1E2D" }}>{pending.length}</span></button></div>} />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="Pending Queue" value={String(stats.pending)} icon={STATUS_KPI.Pending.icon} decorKey="Pending" onClick={() => onNavigate("approval-queue")} />
      <KpiCard label="Overdue 7+ Days" value={String(overdue.length)} icon={Clock} decorKey="Escalated" onClick={() => onNavigate("approval-queue")} />
      <KpiCard label="Approved" value={String(stats.approved)} icon={STATUS_KPI.Approved.icon} decorKey="Approved" />
      <KpiCard label="Returned" value={String(stats.returned)} icon={STATUS_KPI.Returned.icon} decorKey="Returned" />
      <KpiCard label="Declined" value={String(stats.declined)} icon={STATUS_KPI.Declined.icon} decorKey="Declined" />
    </div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_1fr]">
      <Panel title="Requests Requiring My Attention" action={<button type="button" onClick={() => onNavigate("approval-queue")} className="text-xs font-bold text-[#35138D]">View all</button>}>{pending.length === 0 ? <Empty message="No pending approvals." /> : <div>{pending.slice(0, 7).map((d) => <RequestRow key={d.id} declaration={d} onReview={onReview} />)}</div>}</Panel>
      <Panel title="SLA Health"><div className="grid grid-cols-2 gap-3 p-4"><div className="border-l-4 border-emerald-500 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-[#5D6371]">On track</p><p className="mt-1 text-2xl font-extrabold text-[#101426]">{Math.max(0, pending.length - overdue.length)}</p></div><div className="border-l-4 border-red-500 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-[#5D6371]">Overdue</p><p className="mt-1 text-2xl font-extrabold text-[#101426]">{overdue.length}</p></div></div><div className="border-t border-[#E4E7ED] px-4 py-3 text-xs text-[#5D6371]">Pending value: <strong className="text-[#101426]">{formatRand(pending.reduce((sum, d) => sum + d.value, 0))}</strong> · SLA target: <strong className="text-[#101426]">{slaDays} days</strong></div></Panel>
    </div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2"><Panel title="Overdue Approvals" action={<AlertTriangle size={15} className="text-red-600" />}>{overdue.length === 0 ? <Empty message="No approvals overdue by more than seven days." /> : <div>{overdue.slice(0, 5).map((d) => <RequestRow key={d.id} declaration={d} onReview={onReview} overdue />)}</div>}</Panel><Panel title="Recent Decisions" action={<button type="button" onClick={load} aria-label="Refresh recent decisions" className="text-[#5D6371] hover:text-[#35138D]"><RefreshCw size={14} /></button>}>{recent.length === 0 ? <Empty message="No decisions recorded yet." /> : <div>{recent.map((d) => <RequestRow key={d.id} declaration={d} onReview={onReview} />)}</div>}</Panel></div>
  </div>;
}

function RequestRow({ declaration, onReview, overdue = false }: { declaration: Declaration; onReview?: (d: Declaration) => void; overdue?: boolean }) { return <button type="button" onClick={() => onReview?.(declaration)} className={`flex w-full items-center justify-between gap-3 border-b border-[#E4E7ED] border-l-4 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#F5F2FF] ${overdue ? "border-l-red-500 bg-red-50/35" : declaration.status === "Escalated" ? "border-l-orange-500 bg-orange-50/25" : "border-l-transparent"}`}><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#35138D]">{declaration.id}</span>{overdue && <span className="text-[10px] font-extrabold uppercase text-red-600">Overdue</span>}{declaration.status === "Escalated" && <span className="text-[10px] font-extrabold uppercase text-orange-600">Escalated</span>}</div><p className="truncate text-sm font-bold text-[#101426]">{declaration.employee} · {declaration.destination || declaration.to || "Destination pending"}</p><p className="text-[10px] text-[#5D6371]">{declaration.departureDate || "Travel date pending"} · {declaration.reason || "Reason not provided"}</p><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold"><span className="text-[#35138D]">{formatRand(declaration.value)}</span><span className={declaration.priority === "High" ? "text-red-600" : declaration.priority === "Medium" ? "text-orange-600" : "text-[#5D6371]"}>{declaration.priority} priority</span><span className="text-[#5D6371]">Submitted {declaration.submitted}</span></div></div><StatusBadge status={declaration.status} /></button>; }
function Empty({ message }: { message: string }) { return <p className="px-4 py-8 text-center text-xs text-[#5D6371]">{message}</p>; }

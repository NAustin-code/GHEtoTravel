import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchDeclarations } from "@/services/api";
import { Declaration } from "@/types/declaration";
import { buildMonthlyTravelTrend, buildRanking } from "@/app/features/dashboard/dashboardAnalytics";
import { KpiCard } from "@/app/components/KpiCard";
import { PageHeader } from "@/app/components/PageHeader";
import { formatRand } from "@/config/theme";
import { BarChart3, CheckCircle, Clock, FileText, Users } from "lucide-react";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-md border border-[#E4E7ED] bg-white"><h2 className="border-b border-[#E4E7ED] px-4 py-3 text-xs font-extrabold uppercase text-[#35138D]">{title}</h2>{children}</section>;
}

export function TravelAnalysis() {
  const [data, setData] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("All");
  const [department, setDepartment] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchDeclarations().then(setData).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => data.filter((d) => (type === "All" || d.type === type) && (department === "All" || d.department === department) && (!search.trim() || `${d.employee} ${d.destination || d.to || ""} ${d.travelReference || ""}`.toLowerCase().includes(search.toLowerCase()))), [data, type, department, search]);
  const trend = useMemo(() => buildMonthlyTravelTrend(filtered), [filtered]);
  const totalSpend = filtered.reduce((sum, d) => sum + (d.value || 0), 0);
  const travellers = new Set(filtered.flatMap((d) => d.travelers?.map((t) => t.name) || [d.employee])).size;
  const approvalRate = filtered.length ? Math.round(filtered.filter((d) => d.status === "Approved").length / filtered.length * 100) : 0;
  const departments = Array.from(new Set(data.map((d) => d.department))).sort();
  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading analysis…</div>;
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700">Failed to load analysis: {error}</div>;
  return <div className="space-y-5">
    <PageHeader title="Travel Analysis" subtitle="Travel performance, spend, and approval analysis" />
    <div className="grid grid-cols-1 gap-2 rounded-md border border-[#E4E7ED] bg-white p-3 md:grid-cols-4">
      <label className="text-[10px] font-bold uppercase text-[#5D6371]">Travel Type<select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#E4E7ED] px-2 text-xs"><option>All</option><option>Domestic</option><option>International</option></select></label>
      <label className="text-[10px] font-bold uppercase text-[#5D6371]">Department<select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#E4E7ED] px-2 text-xs"><option>All</option>{departments.map((d) => <option key={d}>{d}</option>)}</select></label>
      <label className="text-[10px] font-bold uppercase text-[#5D6371] md:col-span-2">Traveller, destination or reference<input value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#E4E7ED] px-2 text-xs" placeholder="Search…" /></label>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="Total Spend" value={formatRand(totalSpend)} icon={BarChart3} />
      <KpiCard label="Total Trips" value={String(filtered.length)} icon={FileText} />
      <KpiCard label="Total Travellers" value={String(travellers)} icon={Users} />
      <KpiCard label="Average Duration" value={`${trend.length ? (trend.reduce((s, d) => s + d.duration, 0) / trend.length).toFixed(1) : "0.0"} days`} icon={Clock} />
      <KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={CheckCircle} />
    </div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <Panel title="Total Spend Over Time (R)"><Chart data={trend} dataKey="spend" color="#35138D" currency /></Panel>
      <Panel title="Total Trips Over Time"><Chart data={trend} dataKey="trips" color="#074698" /></Panel>
      <Panel title="Total Travellers Over Time"><Chart data={trend} dataKey="travellers" color="#087B84" /></Panel>
    </div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3"><Ranking title="Top Travellers" rows={buildRanking(filtered, "employee")} /><Ranking title="Top Approvers" rows={buildRanking(filtered, "approver")} /><Ranking title="Billing Companies by Spend" rows={buildRanking(filtered, "companyToBeBilled")} /></div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2"><Ranking title="Spend by Reason for Travel" rows={buildRanking(filtered, "reason")} /><Panel title="Average Trip Duration (Days) Over Time"><Chart data={trend} dataKey="duration" color="#35138D" /></Panel></div>
  </div>;
}

function Chart({ data, dataKey, color, currency = false }: { data: { month: string; [key: string]: string | number }[]; dataKey: string; color: string; currency?: boolean }) {
  return <div className="h-56 p-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="#E4E7ED" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => currency ? `R${Math.round(Number(v) / 1000)}k` : String(v)} /><Tooltip formatter={(v) => currency ? formatRand(Number(v)) : v} /><Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>;
}

function Ranking({ title, rows }: { title: string; rows: { name: string; trips: number; spend: number }[] }) {
  return <Panel title={title}><table className="w-full text-xs"><thead><tr className="bg-[#35138D] text-left text-white"><th className="px-3 py-2">#</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Trips</th><th className="px-3 py-2">Spend</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name} className="border-b border-[#E4E7ED]"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2 font-semibold">{r.name}</td><td className="px-3 py-2">{r.trips}</td><td className="px-3 py-2">{formatRand(r.spend)}</td></tr>)}</tbody></table></Panel>;
}

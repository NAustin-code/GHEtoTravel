import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchDeclarations } from "@/services/api";
import { Declaration, TransportMode, TripType } from "@/types/declaration";
import { buildMonthlyTravelTrend, buildRanking, MonthlyTravelTrend } from "@/app/features/dashboard/dashboardAnalytics";
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
  const [bookedFrom, setBookedFrom] = useState("");
  const [bookedTo, setBookedTo] = useState("");
  const [departureFrom, setDepartureFrom] = useState("");
  const [departureTo, setDepartureTo] = useState("");
  const [traveller, setTraveller] = useState("All");
  const [approver, setApprover] = useState("All");
  const [billingCompany, setBillingCompany] = useState("All");
  const [company, setCompany] = useState("All");
  const [tripType, setTripType] = useState("All");
  const [transportMode, setTransportMode] = useState("All");
  const [internalExternal, setInternalExternal] = useState("All");
  const [travelReference, setTravelReference] = useState("");

  useEffect(() => { fetchDeclarations().then(setData).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => data.filter((d) => {
    const booked = String(d.submitted).slice(0, 10);
    const departure = String(d.departureDate || "").slice(0, 10);
    const names = [d.employee, ...(d.travelers || []).map((t) => t.name)].join(" ").toLowerCase();
    return (type === "All" || d.type === type) &&
      (department === "All" || d.department === department) &&
      (traveller === "All" || names.includes(traveller.toLowerCase())) &&
      (approver === "All" || d.approver === approver) &&
      (billingCompany === "All" || d.companyToBeBilled === billingCompany) &&
      (company === "All" || d.company === company) &&
      (tripType === "All" || d.tripType === tripType) &&
      (transportMode === "All" || d.transportMode === transportMode) &&
      (internalExternal === "All" || (d.travelers || []).some((t) => t.internalExternal === internalExternal)) &&
      (!bookedFrom || booked >= bookedFrom) && (!bookedTo || booked <= bookedTo) &&
      (!departureFrom || departure >= departureFrom) && (!departureTo || departure <= departureTo) &&
      (!travelReference.trim() || (d.travelReference || "").toLowerCase().includes(travelReference.toLowerCase())) &&
      (!search.trim() || `${names} ${d.destination || d.to || ""} ${d.travelReference || ""}`.toLowerCase().includes(search.toLowerCase()));
  }), [data, type, department, traveller, approver, billingCompany, company, tripType, transportMode, internalExternal, bookedFrom, bookedTo, departureFrom, departureTo, travelReference, search]);
  const trend = useMemo(() => buildMonthlyTravelTrend(filtered), [filtered]);
  const totalSpend = filtered.reduce((sum, d) => sum + (d.value || 0), 0);
  const travellers = new Set(filtered.flatMap((d) => d.travelers?.map((t) => t.name) || [d.employee])).size;
  const approvalRate = filtered.length ? Math.round(filtered.filter((d) => d.status === "Approved").length / filtered.length * 100) : 0;
  const departments = Array.from(new Set(data.map((d) => d.department))).sort();
  const travellerOptions = Array.from(new Set(data.flatMap((d) => [d.employee, ...(d.travelers || []).map((t) => t.name)]))).sort();
  const approvers = Array.from(new Set(data.map((d) => d.approver).filter(Boolean))).sort();
  const billingCompanies = Array.from(new Set(data.map((d) => d.companyToBeBilled).filter(Boolean))).sort();
  const companies = Array.from(new Set(data.map((d) => d.company).filter(Boolean))).sort();
  const clearFilters = () => { setType("All"); setDepartment("All"); setSearch(""); setBookedFrom(""); setBookedTo(""); setDepartureFrom(""); setDepartureTo(""); setTraveller("All"); setApprover("All"); setBillingCompany("All"); setCompany("All"); setTripType("All"); setTransportMode("All"); setInternalExternal("All"); setTravelReference(""); };
  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading analysis…</div>;
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700">Failed to load analysis: {error}</div>;
  return <div className="space-y-5">
    <PageHeader title="Travel Analysis" subtitle="Travel performance, spend, and approval analysis" />
    <div className="rounded-md border border-[#E4E7ED] bg-white p-3"><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Filter label="Date Booked From"><input type="date" value={bookedFrom} onChange={(e) => setBookedFrom(e.target.value)} /></Filter><Filter label="Date Booked To"><input type="date" value={bookedTo} onChange={(e) => setBookedTo(e.target.value)} /></Filter>
      <Filter label="Departure From"><input type="date" value={departureFrom} onChange={(e) => setDepartureFrom(e.target.value)} /></Filter><Filter label="Departure To"><input type="date" value={departureTo} onChange={(e) => setDepartureTo(e.target.value)} /></Filter>
      <Filter label="Traveller"><select value={traveller} onChange={(e) => setTraveller(e.target.value)}><option>All</option>{travellerOptions.map((d) => <option key={d}>{d}</option>)}</select></Filter><Filter label="Department"><select value={department} onChange={(e) => setDepartment(e.target.value)}><option>All</option>{departments.map((d) => <option key={d}>{d}</option>)}</select></Filter>
      <Filter label="Approver"><select value={approver} onChange={(e) => setApprover(e.target.value)}><option>All</option>{approvers.map((d) => <option key={d}>{d}</option>)}</select></Filter><Filter label="Billing Company"><select value={billingCompany} onChange={(e) => setBillingCompany(e.target.value)}><option>All</option>{billingCompanies.map((d) => <option key={d}>{d}</option>)}</select></Filter>
      <Filter label="Company"><select value={company} onChange={(e) => setCompany(e.target.value)}><option>All</option>{companies.map((d) => <option key={d}>{d}</option>)}</select></Filter><Filter label="Travel Type"><select value={type} onChange={(e) => setType(e.target.value)}><option>All</option><option>Domestic</option><option>International</option></select></Filter>
      <Filter label="Trip Type"><select value={tripType} onChange={(e) => setTripType(e.target.value)}><option>All</option>{(["One Way", "Return"] as TripType[]).map((d) => <option key={d}>{d}</option>)}</select></Filter><Filter label="Transport Mode"><select value={transportMode} onChange={(e) => setTransportMode(e.target.value)}><option>All</option>{(["None", "Flight", "Bus", "Train", "Car", "Other"] as TransportMode[]).map((d) => <option key={d}>{d}</option>)}</select></Filter>
      <Filter label="Internal / External"><select value={internalExternal} onChange={(e) => setInternalExternal(e.target.value)}><option>All</option><option>Internal</option><option>External</option></select></Filter><Filter label="Travel Reference"><input value={travelReference} onChange={(e) => setTravelReference(e.target.value)} placeholder="Search…" /></Filter>
      <Filter label="Search"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Traveller or destination…" /></Filter>
    </div><div className="mt-3 flex justify-end"><button type="button" onClick={clearFilters} className="text-xs font-bold text-[#35138D] hover:underline">Clear filters</button></div></div>
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

function Chart({ data, dataKey, color, currency = false }: { data: MonthlyTravelTrend[]; dataKey: keyof MonthlyTravelTrend; color: string; currency?: boolean }) {
  return <div className="h-56 p-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="#E4E7ED" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => currency ? `R${Math.round(Number(v) / 1000)}k` : String(v)} /><Tooltip formatter={(v) => currency ? formatRand(Number(v)) : v} /><Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>;
}

function Ranking({ title, rows }: { title: string; rows: { name: string; trips: number; spend: number }[] }) {
  return <Panel title={title}><table className="w-full text-xs"><thead><tr className="bg-[#35138D] text-left text-white"><th className="px-3 py-2">#</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Trips</th><th className="px-3 py-2">Spend</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name} className="border-b border-[#E4E7ED]"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2 font-semibold">{r.name}</td><td className="px-3 py-2">{r.trips}</td><td className="px-3 py-2">{formatRand(r.spend)}</td></tr>)}</tbody></table></Panel>;
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-[10px] font-bold uppercase text-[#5D6371]">{label}{<span className="block [&>input]:mt-1 [&>input]:h-9 [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-[#E4E7ED] [&>input]:px-2 [&>input]:text-xs [&>select]:mt-1 [&>select]:h-9 [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-[#E4E7ED] [&>select]:bg-white [&>select]:px-2 [&>select]:text-xs">{children}</span>}</label>; }

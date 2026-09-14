import { Declaration } from "@/types/declaration";

export interface MonthlyTravelTrend {
  month: string;
  spend: number;
  trips: number;
  travellers: number;
  duration: number;
}

export interface RankingRow {
  name: string;
  trips: number;
  spend: number;
}

function durationFor(declaration: Declaration): number {
  if (!declaration.departureDate || !declaration.returnDate) return 1;
  const start = new Date(declaration.departureDate).getTime();
  const end = new Date(declaration.returnDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function buildMonthlyTravelTrend(declarations: Declaration[]): MonthlyTravelTrend[] {
  const months = new Map<string, { month: string; spend: number; trips: number; travellers: number; durationTotal: number }>();
  declarations.forEach((declaration) => {
    const date = new Date(declaration.departureDate || declaration.submitted);
    if (!Number.isFinite(date.getTime())) return;
    const month = date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
    const current = months.get(month) || { month, spend: 0, trips: 0, travellers: 0, durationTotal: 0 };
    current.spend += Number.isFinite(declaration.value) ? declaration.value : 0;
    current.trips += 1;
    current.travellers += declaration.numberOfPeople || declaration.travelers?.length || 1;
    current.durationTotal += durationFor(declaration);
    months.set(month, current);
  });
  return Array.from(months.values()).slice(-12).map(({ durationTotal, ...row }) => ({
    ...row,
    duration: Number((durationTotal / row.trips).toFixed(1)),
  }));
}

export function buildRanking(
  declarations: Declaration[],
  field: "employee" | "approver" | "companyToBeBilled" | "reason" | "internalExternal",
): RankingRow[] {
  const rows = new Map<string, RankingRow>();
  declarations.forEach((declaration) => {
    const name = String(declaration[field] || "Not specified");
    const current = rows.get(name) || { name, trips: 0, spend: 0 };
    current.trips += 1;
    current.spend += Number.isFinite(declaration.value) ? declaration.value : 0;
    rows.set(name, current);
  });
  return Array.from(rows.values()).sort((a, b) => b.spend - a.spend).slice(0, 5);
}

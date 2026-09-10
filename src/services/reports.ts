import { getDestinationConcentration, getHighValueRows, getReportList, getSLAData, getStatusBreakdown, listDeclarations } from "./localStore";

export interface ReportsData {
  statusBreakdown: Record<string, number>;
  slaData: Array<{ role: string; avg: number; min: number; max: number; count: number }>;
  counterpartyData: Array<{ counterparty: string; count: number; totalValue: number; avgValue: number }>;
  highValueData: Array<{ employee: string; lineManager: string; declarationCount: number; totalValue: number; averageValue: number; totalGift: number; totalHospitality: number; totalEntertainment: number; mostFrequentSupplier: string }>;
  declarations: any[];
  departments: string[];
}

function buildParams(params?: Record<string, string>): Record<string, string> | undefined {
  if (!params) return undefined;
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (v && v !== "All Departments" && v !== "All Statuses") cleaned[k] = v;
  return Object.keys(cleaned).length ? cleaned : undefined;
}

export async function fetchReports(params?: Record<string, string>): Promise<ReportsData> {
  const query = buildParams(params);
  const declarations = listDeclarations(query?.status, query?.search);
  const departments = [...new Set(declarations.map((d: any) => d.department).filter(Boolean))].sort();
  return {
    statusBreakdown: getStatusBreakdown(query),
    slaData: getSLAData(query),
    counterpartyData: getDestinationConcentration(query),
    highValueData: getHighValueRows(query),
    declarations: getReportList(query),
    departments,
  };
}

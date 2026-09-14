import { getDestinationConcentration, getHighValueRows, getReportList, getSLAData, getStatusBreakdown, getTripTypeReport, getTransportModeReport, getDepartmentSpendReport } from "./localStore";
import type { Declaration } from "@/types/declaration";

export interface ReportsData {
  statusBreakdown: Record<string, number>;
  slaData: Array<{ role: string; avg: number; min: number; max: number; count: number }>;
  counterpartyData: Array<{ counterparty: string; count: number; totalValue: number; avgValue: number }>;
  highValueData: Array<{ employee: string; lineManager: string; declarationCount: number; totalValue: number; averageValue: number; totalDomestic: number; totalInternational: number; totalOther: number; mostFrequentSupplier: string }>;
  tripTypeData: Array<{ tripType: string; count: number; totalValue: number; avgValue: number }>;
  transportModeData: Array<{ transportMode: string; count: number; totalValue: number; avgValue: number }>;
  departmentSpendData: Array<{ department: string; count: number; totalValue: number; avgValue: number }>;
  declarations: Declaration[];
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
  const filtered = getReportList(query);
  const departments = [...new Set(filtered.map((d: Declaration) => d.department).filter(Boolean))].sort();
  return {
    statusBreakdown: getStatusBreakdown(query),
    slaData: getSLAData(query),
    counterpartyData: getDestinationConcentration(query),
    highValueData: getHighValueRows(query),
    tripTypeData: getTripTypeReport(query),
    transportModeData: getTransportModeReport(query),
    departmentSpendData: getDepartmentSpendReport(query),
    declarations: filtered,
    departments,
  };
}

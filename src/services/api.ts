import { Declaration, ComplianceTrendPoint, TypeBreakdownItem, UploadedFile } from"@/types/declaration"
import * as store from "@/services/localStore"

// Local-store backed service layer (no backend). Signatures match the former
// REST API wrappers so components and tests keep working unchanged.

export async function fetchDeclarations(status?: string, search?: string): Promise<Declaration[]> {
  return store.listDeclarations(status, search);
}

export async function fetchDeclarationById(id: string): Promise<Declaration> {
  const declaration = store.findDeclarationById(id);
  return { ...declaration, workflowSteps: declaration.workflowSteps ?? [] };
}

export async function createDeclaration(declaration: Partial<Declaration>): Promise<Declaration> {
  return store.createDeclarationRecord(declaration);
}

export async function updateDeclaration(id: string, data: Partial<Declaration>): Promise<Declaration> {
  return store.updateDeclarationRecord(id, data);
}

export async function updateDeclarationStatus(id: string, status: string): Promise<Declaration> {
  return store.setDeclarationStatus(id, status);
}

export async function submitDeclaration(id: string): Promise<Declaration> {
  return store.submitDeclarationRecord(id);
}

export async function uploadDeclarationFile(file: File, declarationId: string): Promise<UploadedFile> {
  return store.uploadFileRecord(file, declarationId);
}
export interface DashboardStats {
  kpis: {
    total: number;
    pending: number;
    approved: number;
    declined: number;
    escalated: number;
    totalValue: number;
  };
  complianceTrend: ComplianceTrendPoint[];
  typeBreakdown: TypeBreakdownItem[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return store.getDashboardStats();
}

// ── Admin: Users ─────────────────────────────────────
export async function fetchUsers(search?: string, role?: string): Promise<any[]> {
  return store.listUsers(search, role);
}

export async function fetchUserById(id: string): Promise<any> {
  return store.findUserById(id);
}

export async function fetchManagers(organizationId?: string): Promise<any[]> {
  return store.findManagers(organizationId);
}

export async function fetchDepartments(organizationId?: string): Promise<string[]> {
  return store.listDepartments(organizationId);
}

export async function createUser(data: any): Promise<any> {
  return store.createUserRecord(data);
}

export async function updateUser(id: string, data: any): Promise<any> {
  return store.updateUserRecord(id, data);
}

export async function deleteUser(id: string): Promise<any> {
  return store.deleteUserRecord(id);
}

// ── Admin: Config ─────────────────────────────────────
export async function fetchConfig(): Promise<any> {
  return store.getConfig();
}

export async function saveConfig(data: any): Promise<any> {
  return store.saveConfigRecord(data);
}

// ── Admin: Dropdowns ──────────────────────────────────
export async function fetchDropdowns(): Promise<any> {
  return store.getDropdowns();
}

export async function updateDropdowns(data: any): Promise<any> {
  return store.saveDropdownsRecord(data);
}

// ── Admin: Dashboard ──────────────────────────────────
export async function fetchAdminDashboard(): Promise<any> {
  return store.getAdminDashboard();
}

// ── Admin: Workflow Rules ─────────────────────────────
export async function fetchWorkflowRules(): Promise<any[]> {
  return store.listWorkflowRules();
}

export async function createWorkflowRule(data: any): Promise<any> {
  return store.createWorkflowRuleRecord(data);
}

export async function updateWorkflowRule(id: string, data: any): Promise<any> {
  return store.updateWorkflowRuleRecord(id, data);
}

export async function deleteWorkflowRule(id: string): Promise<any> {
  return store.deleteWorkflowRuleRecord(id);
}

// ── Workflows ─────────────────────────────────────────
export async function fetchPendingWorkflows(): Promise<any[]> {
  return store.listPendingWorkflows();
}

export async function fetchWorkflowInstance(declarationId: string): Promise<any> {
  return store.findWorkflowInstance(declarationId);
}

export async function approveWorkflowStep(data: {
  declarationId: string;
  decision: string;
  notes?: string;
}): Promise<any> {
  return store.decideWorkflowStep(data.declarationId, data.decision, data.notes);
}

// ── Reports ───────────────────────────────────────────
export async function fetchReportStatusBreakdown(params?: Record<string, string>): Promise<any> {
  return store.getStatusBreakdown(params);
}

export async function fetchReportSLA(params?: Record<string, string>): Promise<any[]> {
  return store.getSLAData(params);
}

export async function fetchReportCounterpartyConcentration(params?: Record<string, string>): Promise<any[]> {
  return store.getDestinationConcentration(params);
}

export async function fetchReportHighValue(): Promise<any[]> {
  return store.getHighValueRows();
}

export async function fetchReportList(params?: Record<string, string>): Promise<any[]> {
  return store.getReportList(params);
}

// ── Approval Options ──────────────────────────────────
export async function fetchApprovalOptions(): Promise<any[]> {
  return store.listApprovalOptions();
}
export async function createApprovalOption(data: { id: string; value: string; label: string }): Promise<any> {
  return store.createApprovalOptionRecord(data);
}
export async function updateApprovalOption(id: string, data: { value: string; label: string }): Promise<any> {
  return store.updateApprovalOptionRecord(id, data);
}
export async function deleteApprovalOption(id: string): Promise<any> {
  return store.deleteApprovalOptionRecord(id);
}

// ── Organizations ─────────────────────────────────────
export async function fetchOrganizations(): Promise<{ id: string; name: string; shortCode: string }[]> {
  return store.listOrganizations();
}

export async function fetchAdminOrganizations(): Promise<{ id: string; name: string; shortCode: string }[]> {
  return store.listOrganizations();
}

export async function createOrganization(data: { name: string; shortCode: string }): Promise<any> {
  return store.createOrganizationRecord(data);
}

export async function updateOrganization(id: string, data: { name: string; shortCode: string }): Promise<any> {
  return store.updateOrganizationRecord(id, data);
}

export async function deleteOrganization(id: string): Promise<any> {
  return store.deleteOrganizationRecord(id);
}

export { resetLocalStore } from "@/services/localStore";


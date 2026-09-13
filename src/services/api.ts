import { Declaration, ComplianceTrendPoint, Dropdowns, StatusType, SystemConfig, TypeBreakdownItem, UploadedFile, User, WorkflowInstance, WorkflowRule, WorkflowStep } from"@/types/declaration"
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

export async function downloadStoredFile(declarationId: string, file: UploadedFile): Promise<Blob> {
  return store.readStoredFile(declarationId, file);
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
export async function fetchUsers(search?: string, role?: string): Promise<User[]> {
  return store.listUsers(search, role);
}

export async function fetchUserById(id: string): Promise<User> {
  return store.findUserById(id);
}

export async function fetchManagers(organizationId?: string): Promise<{ id: string; name: string; email: string; position: string; department: string }[]> {
  return store.findManagers(organizationId);
}

export async function fetchDepartments(organizationId?: string): Promise<string[]> {
  return store.listDepartments(organizationId);
}

export async function createUser(data: Partial<User> & { password?: string }): Promise<User> {
  return store.createUserRecord(data);
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  return store.updateUserRecord(id, data);
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return store.deleteUserRecord(id);
}

// ── Admin: Config ─────────────────────────────────────
export async function fetchConfig(): Promise<SystemConfig> {
  return store.getConfig();
}

export async function saveConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
  return store.saveConfigRecord(data);
}

// ── Admin: Dropdowns ──────────────────────────────────
export async function fetchDropdowns(): Promise<Dropdowns> {
  return store.getDropdowns();
}

const DROPDOWN_KEYS = ["departments", "categories", "occasions", "receivedGiven", "biddingProcess", "publicOfficial", "relationships", "partyTypes"] as const;

export async function updateDropdowns(data: Record<string, string[]>): Promise<Dropdowns> {
  const patch: Partial<Dropdowns> = {};
  for (const key of DROPDOWN_KEYS) {
    if (Array.isArray(data[key])) patch[key] = [...data[key]];
  }
  return store.saveDropdownsRecord(patch);
}

// ── Admin: Dashboard ──────────────────────────────────
export async function fetchAdminDashboard(): Promise<{ users: number; workflows: number; declarations: number; threshold: number }> {
  return store.getAdminDashboard();
}

// ── Admin: Workflow Rules ─────────────────────────────
export async function fetchWorkflowRules(): Promise<WorkflowRule[]> {
  return store.listWorkflowRules();
}

export async function createWorkflowRule(data: Partial<WorkflowRule>): Promise<WorkflowRule> {
  return store.createWorkflowRuleRecord(data);
}

export async function updateWorkflowRule(id: string, data: Partial<WorkflowRule>): Promise<WorkflowRule> {
  return store.updateWorkflowRuleRecord(id, data);
}

export async function deleteWorkflowRule(id: string): Promise<{ message: string }> {
  return store.deleteWorkflowRuleRecord(id);
}

// ── Workflows ─────────────────────────────────────────
export async function fetchPendingWorkflows(): Promise<{ declaration: Declaration; step: WorkflowStep | null }[]> {
  return store.listPendingWorkflows();
}

export async function fetchWorkflowInstance(declarationId: string): Promise<WorkflowInstance> {
  return store.findWorkflowInstance(declarationId);
}

export interface WorkflowDecisionResult {
  declarationId: string;
  steps: WorkflowStep[];
  status: StatusType;
  newStatus: StatusType;
}

export async function approveWorkflowStep(data: {
  declarationId: string;
  decision: string;
  notes?: string;
}): Promise<WorkflowDecisionResult> {
  return store.decideWorkflowStep(data.declarationId, data.decision, data.notes);
}

// ── Reports ───────────────────────────────────────────
export async function fetchReportStatusBreakdown(params?: Record<string, string>): Promise<Record<string, number>> {
  return store.getStatusBreakdown(params);
}

export async function fetchReportSLA(params?: Record<string, string>): Promise<{ role: string; avg: number; min: number; max: number; count: number }[]> {
  return store.getSLAData(params);
}

export async function fetchReportCounterpartyConcentration(params?: Record<string, string>): Promise<{ counterparty: string; count: number; totalValue: number; avgValue: number }[]> {
  return store.getDestinationConcentration(params);
}

export async function fetchReportHighValue(): Promise<{ employee: string; lineManager: string; declarationCount: number; totalValue: number; averageValue: number; totalDomestic: number; totalInternational: number; totalOther: number; mostFrequentSupplier: string }[]> {
  return store.getHighValueRows();
}

export async function fetchReportList(params?: Record<string, string>): Promise<Declaration[]> {
  return store.getReportList(params);
}

// ── Approval Options ──────────────────────────────────
export interface ApprovalOption {
  id: string;
  value: string;
  label: string;
}

export async function fetchApprovalOptions(): Promise<ApprovalOption[]> {
  return store.listApprovalOptions();
}
export async function createApprovalOption(data: { id: string; value: string; label: string }): Promise<ApprovalOption> {
  return store.createApprovalOptionRecord(data);
}
export async function updateApprovalOption(id: string, data: { value: string; label: string }): Promise<ApprovalOption> {
  return store.updateApprovalOptionRecord(id, data);
}
export async function deleteApprovalOption(id: string): Promise<{ message: string }> {
  return store.deleteApprovalOptionRecord(id);
}

// ── Organizations ─────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  shortCode: string;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  return store.listOrganizations();
}

export async function fetchAdminOrganizations(): Promise<Organization[]> {
  return store.listOrganizations();
}

export async function createOrganization(data: { name: string; shortCode: string }): Promise<Organization> {
  return store.createOrganizationRecord(data);
}

export async function updateOrganization(id: string, data: { name: string; shortCode: string }): Promise<Organization> {
  return store.updateOrganizationRecord(id, data);
}

export async function deleteOrganization(id: string): Promise<{ message: string }> {
  return store.deleteOrganizationRecord(id);
}

export { resetLocalStore } from "@/services/localStore";


import { describe, it, expect, vi, beforeEach } from "vitest";
import { setToken, clearToken, getAuthToken } from "../services/httpClient";
import {
  fetchDeclarations, fetchDeclarationById, createDeclaration,
  updateDeclaration, updateDeclarationStatus, submitDeclaration,
  fetchDashboardStats, fetchUsers, fetchUserById,
  createUser, updateUser, deleteUser,
  fetchConfig, saveConfig,
  fetchDropdowns, updateDropdowns,
  fetchAdminDashboard,
  fetchWorkflowRules, createWorkflowRule, updateWorkflowRule, deleteWorkflowRule,
  fetchPendingWorkflows, fetchWorkflowInstance, approveWorkflowStep,
  fetchReportStatusBreakdown, fetchReportSLA,
  fetchReportCounterpartyConcentration, fetchReportHighValue,
  fetchReportList, fetchApprovalOptions,
  createApprovalOption, updateApprovalOption, deleteApprovalOption,
  uploadDeclarationFile, fetchOrganizations, fetchAdminOrganizations,
  createOrganization, updateOrganization, deleteOrganization,
  downloadStoredFile, resetLocalStore,
} from "../services/api";
import { Declaration } from "../types/declaration";

beforeEach(() => {
  clearToken();
  localStorage.clear();
  resetLocalStore();
  vi.restoreAllMocks();
});

function mockDeclaration(id = "TR-2026-9000"): Declaration {
  return {
    id, employee: "Test User", employeeId: "user-1", department: "IT",
    type: "Domestic", counterparty: "Cape Town", value: 500, submitted: "2026-07-01",
    approver: "Sipho Nkosi", status: "Draft", priority: "Medium",
    description: "Test", relationship: "Yes", teamMemberNumber: "TM-001",
    lineManager: "Sipho Nkosi", position: "Dev", receivedGiven: "Received",
    from: "Durban", contactPerson: "Jane", biddingProcess: "No",
    occasion: "Client visit", date: "2026-07-01", instances: "1",
    publicOfficial: "No",
  };
}

describe("fetchDeclarations", () => {
  it("returns seeded declarations", async () => {
    const result = await fetchDeclarations();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBeTruthy();
  });

  it("filters by status", async () => {
    const result = await fetchDeclarations("Pending");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((d) => d.status === "Pending")).toBe(true);
  });

  it("filters by search text across id, destination and employee", async () => {
    const byDestination = await fetchDeclarations(undefined, "Cape Town");
    expect(byDestination.length).toBeGreaterThan(0);
    expect(byDestination.every((d) => (d.destination || d.counterparty) === "Cape Town")).toBe(true);
    const byId = await fetchDeclarations(undefined, "TR-2026-0001");
    expect(byId.map((d) => d.id)).toContain("TR-2026-0001");
  });
});

describe("fetchDeclarationById", () => {
  it("returns declaration with workflowSteps array", async () => {
    const result = await fetchDeclarationById("TR-2026-0001");
    expect(result.id).toBe("TR-2026-0001");
    expect(Array.isArray(result.workflowSteps)).toBe(true);
  });

  it("throws 404 for unknown id", async () => {
    await expect(fetchDeclarationById("NOPE-1")).rejects.toMatchObject({ status: 404 });
  });
});

describe("file and organization API wrappers", () => {
  it("uploads a file with the declaration ID", async () => {
    const file = new File(["receipt"], "receipt.txt", { type: "text/plain" });
    const result = await uploadDeclarationFile(file, "TR-2026-0001");
    expect(result.name).toBe("receipt.txt");
    expect(result.size).toBe(7);
    expect(result.url).toContain("TR-2026-0001");
  });

  it("downloads uploaded bytes back within the session", async () => {
    const file = new File(["receipt-bytes"], "roundtrip.txt", { type: "text/plain" });
    const uploaded = await uploadDeclarationFile(file, "TR-2026-0001");
    const blob = await downloadStoredFile("TR-2026-0001", uploaded);
    await expect(blob.text()).resolves.toBe("receipt-bytes");
  });

  it("rejects with a user-facing message when file content is gone", async () => {
    await expect(
      downloadStoredFile("TR-2026-0001", { name: "ghost.pdf", size: 0, type: "", url: "local:file/TR-2026-0001/ghost.pdf" }),
    ).rejects.toThrow(/no longer available/);
  });

  it("covers organization list and admin CRUD wrappers", async () => {
    expect((await fetchOrganizations())[0].id).toBeTruthy();
    expect((await fetchAdminOrganizations())[0].shortCode).toBeTruthy();
    const created = await createOrganization({ name: "NPN", shortCode: "NPN" });
    expect(created.id).toBeTruthy();
    const updated = await updateOrganization(created.id, { name: "NPN Updated", shortCode: "NPN" });
    expect(updated.name).toBe("NPN Updated");
    expect((await deleteOrganization(created.id)).message).toContain("deleted");
    await expect(fetchOrganizations().then((orgs) => {
      if (orgs.some((o) => o.id === created.id)) throw new Error("still present");
    })).resolves.toBeUndefined();
  });

  it("throws 404 for unknown organization", async () => {
    await expect(updateOrganization("org-nope", { name: "X", shortCode: "X" })).rejects.toMatchObject({ status: 404 });
    await expect(deleteOrganization("org-nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("createDeclaration", () => {
  it("creates a declaration with Draft status by default", async () => {
    const result = await createDeclaration(mockDeclaration());
    expect(result.id).toBe("TR-2026-9000");
    expect(result.status).toBe("Draft");
  });

  it("persists the declaration for later fetch", async () => {
    await createDeclaration(mockDeclaration());
    const fetched = await fetchDeclarationById("TR-2026-9000");
    expect(fetched.employee).toBe("Test User");
  });

  it("assigns a TR- id when none is provided", async () => {
    const { id, ...rest } = mockDeclaration();
    void id;
    const result = await createDeclaration(rest);
    expect(result.id).toMatch(/^TR-\d{4}-\d+/);
  });
});

describe("updateDeclaration", () => {
  it("merges changes and returns updated declaration", async () => {
    await createDeclaration(mockDeclaration());
    const result = await updateDeclaration("TR-2026-9000", { description: "Updated" });
    expect(result.description).toBe("Updated");
    expect(result.employee).toBe("Test User");
  });

  it("throws 404 for unknown id", async () => {
    await expect(updateDeclaration("NOPE-1", { description: "Updated" })).rejects.toMatchObject({ status: 404 });
  });
});

describe("updateDeclarationStatus", () => {
  it("sets status and returns declaration", async () => {
    await createDeclaration(mockDeclaration());
    const result = await updateDeclarationStatus("TR-2026-9000", "Approved");
    expect(result.status).toBe("Approved");
  });
});

describe("submitDeclaration", () => {
  it("moves Draft to Pending and builds a workflow", async () => {
    await createDeclaration(mockDeclaration());
    const result = await submitDeclaration("TR-2026-9000");
    expect(result.status).toBe("Pending");
    const wf = await fetchWorkflowInstance("TR-2026-9000");
    expect(wf.steps).toHaveLength(2);
    expect(wf.steps[0].status).toBe("pending");
  });

  it("rejects resubmitting a Pending declaration with 409", async () => {
    await expect(submitDeclaration("TR-2024-0047")).rejects.toMatchObject({ status: 409 });
  });

  it("rejects submitting an Approved declaration with 409", async () => {
    await expect(submitDeclaration("TR-2025-0009")).rejects.toThrow("Cannot submit an Approved declaration");
  });

  it("throws 404 for unknown id", async () => {
    await expect(submitDeclaration("NOPE-1")).rejects.toMatchObject({ status: 404 });
  });
});

describe("fetchDashboardStats", () => {
  it("returns stats computed from seed data", async () => {
    const result = await fetchDashboardStats();
    expect(result.kpis.total).toBe(10);
    expect(result.kpis.pending).toBe(4);
    expect(result.kpis.approved).toBe(2);
    expect(result.kpis.declined).toBe(1);
    expect(result.kpis.totalValue).toBe(26500);
    expect(result.complianceTrend.length).toBeGreaterThan(0);
    expect(result.typeBreakdown.length).toBeGreaterThan(0);
  });
});

describe("fetchUsers", () => {
  it("searches by name", async () => {
    const result = await fetchUsers("Sipho");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Sipho Nkosi");
  });

  it("filters by role", async () => {
    const result = await fetchUsers(undefined, "approver");
    expect(result.length).toBe(4);
  });
});

describe("fetchUserById", () => {
  it("returns seeded user without password hash", async () => {
    const result = await fetchUserById("user-2");
    expect(result.name).toBe("Sipho Nkosi");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("throws 404 for unknown id", async () => {
    await expect(fetchUserById("user-nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("createUser", () => {
  it("creates and returns new user", async () => {
    const result = await createUser({ name: "New User", email: "new@test.com", role: "teamMember" });
    expect(result.id).toBeTruthy();
    expect(result.name).toBe("New User");
    expect((await fetchUsers("New User"))).toHaveLength(1);
  });
});

describe("updateUser", () => {
  it("merges and returns updated user", async () => {
    const result = await updateUser("user-1", { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("throws 404 for unknown id", async () => {
    await expect(updateUser("user-nope", { name: "X" })).rejects.toMatchObject({ status: 404 });
  });
});

describe("deleteUser", () => {
  it("deletes and confirms removal", async () => {
    const result = await deleteUser("user-3");
    expect(result.message).toBe("User deleted");
    await expect(fetchUserById("user-3")).rejects.toMatchObject({ status: 404 });
  });

  it("throws 404 for unknown id", async () => {
    await expect(deleteUser("user-nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("fetchConfig", () => {
  it("returns seeded config", async () => {
    const result = await fetchConfig();
    expect(result.highValueThreshold).toBe(5000);
    expect(result.slaEscalationDays).toBe(7);
  });
});

describe("saveConfig", () => {
  it("persists config changes", async () => {
    const result = await saveConfig({ highValueThreshold: 8000 });
    expect(result.highValueThreshold).toBe(8000);
    expect((await fetchConfig()).highValueThreshold).toBe(8000);
  });
});

describe("fetchDropdowns / updateDropdowns", () => {
  it("fetchDropdowns returns dropdowns", async () => {
    const result = await fetchDropdowns();
    expect(result.departments).toContain("Marketing");
  });

  it("updateDropdowns persists dropdowns", async () => {
    const result = await updateDropdowns({ departments: ["IT"] });
    expect(result.departments).toEqual(["IT"]);
    expect((await fetchDropdowns()).departments).toEqual(["IT"]);
  });
});

describe("fetchAdminDashboard", () => {
  it("returns counts from the store", async () => {
    const result = await fetchAdminDashboard();
    expect(result.users).toBe(7);
    expect(result.declarations).toBe(10);
    expect(result.threshold).toBe(5000);
  });
});

describe("workflow rules CRUD", () => {
  it("fetchWorkflowRules returns seeded rules", async () => {
    const result = await fetchWorkflowRules();
    expect(result).toHaveLength(2);
  });

  it("createWorkflowRule creates", async () => {
    const result = await createWorkflowRule({ name: "New Rule" });
    expect(result.id).toBeTruthy();
    expect(result.name).toBe("New Rule");
  });

  it("updateWorkflowRule updates", async () => {
    const result = await updateWorkflowRule("rule-1", { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("deleteWorkflowRule deletes and 404s afterwards", async () => {
    const result = await deleteWorkflowRule("rule-1");
    expect(result.message).toContain("deleted");
    await expect(updateWorkflowRule("rule-1", { name: "X" })).rejects.toMatchObject({ status: 404 });
  });
});

describe("workflow operations", () => {
  it("fetchPendingWorkflows returns pending declarations with current step", async () => {
    const result = await fetchPendingWorkflows();
    expect(result.length).toBe(5);
    expect(result[0].declaration.counterparty).toBeTruthy();
    expect(result[0].step?.status).toBe("pending");
  });

  it("fetchWorkflowInstance returns seeded instance", async () => {
    const result = await fetchWorkflowInstance("TR-2024-0047");
    expect(result.declarationId).toBe("TR-2024-0047");
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].role).toBe("lineManager");
  });

  it("approveWorkflowStep advances a fresh submission", async () => {
    await createDeclaration(mockDeclaration("TR-2026-9100"));
    await submitDeclaration("TR-2026-9100");
    const first = await approveWorkflowStep({ declarationId: "TR-2026-9100", decision: "accept" });
    expect(first.status).toBe("Pending");
    const second = await approveWorkflowStep({ declarationId: "TR-2026-9100", decision: "accept", notes: "Looks good" });
    expect(second.status).toBe("Approved");
    expect(second.steps[1].notes).toBe("Looks good");
    expect(second.newStatus).toBe("Approved");
  });

  it("approveWorkflowStep declines terminally", async () => {
    await createDeclaration(mockDeclaration("TR-2026-9200"));
    await submitDeclaration("TR-2026-9200");
    const result = await approveWorkflowStep({ declarationId: "TR-2026-9200", decision: "decline" });
    expect(result.status).toBe("Declined");
    await expect(
      approveWorkflowStep({ declarationId: "TR-2026-9200", decision: "accept" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("approveWorkflowStep rejects deciding a Draft declaration", async () => {
    await createDeclaration(mockDeclaration("TR-2026-9300"));
    await expect(
      approveWorkflowStep({ declarationId: "TR-2026-9300", decision: "accept" })
    ).rejects.toThrow("Cannot decide a Draft declaration");
  });
});

describe("report endpoints", () => {
  it("fetchReportStatusBreakdown returns breakdown", async () => {
    const result = await fetchReportStatusBreakdown();
    expect(result.Pending).toBe(4);
    expect(result.Approved).toBe(2);
  });

  it("fetchReportSLA returns SLA data from decided steps", async () => {
    const result = await fetchReportSLA();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("count");
  });

  it("fetchReportCounterpartyConcentration returns data", async () => {
    const result = await fetchReportCounterpartyConcentration();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("avgValue");
  });

  it("fetchReportHighValue returns employees above threshold", async () => {
    const result = await fetchReportHighValue();
    expect(result).toHaveLength(2);
    expect(result[0].totalValue).toBeGreaterThanOrEqual(result[1].totalValue);
  });

  it("fetchReportList returns list", async () => {
    const result = await fetchReportList();
    expect(result).toHaveLength(10);
  });

  it("fetchReportList honors date range params", async () => {
    const result = await fetchReportList({ startDate: "2026-01-01", endDate: "2026-12-31" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((d) => d.submitted.slice(0, 10) >= "2026-01-01" && d.submitted.slice(0, 10) <= "2026-12-31")).toBe(true);
  });

  it("fetchReportStatusBreakdown honors date range params", async () => {
    const result = await fetchReportStatusBreakdown({ startDate: "2024-01-01", endDate: "2024-12-31" });
    expect(result.Pending).toBe(3);
    expect(result.Approved || 0).toBe(0);
  });

  it("fetchApprovalOptions returns seeded options", async () => {
    const result = await fetchApprovalOptions();
    expect(result).toHaveLength(5);
  });

  it("createApprovalOption creates new option", async () => {
    const result = await createApprovalOption({ id: "new-opt", value: "new-opt", label: "New Option" });
    expect(result.value).toBe("new-opt");
  });

  it("updateApprovalOption updates option", async () => {
    const result = await updateApprovalOption("accept", { value: "accept", label: "Updated" });
    expect(result.label).toBe("Updated");
  });

  it("deleteApprovalOption deletes option", async () => {
    const result = await deleteApprovalOption("accept");
    expect(result.message).toBe("Approval option deleted");
    expect((await fetchApprovalOptions()).find((o) => o.value === "accept")).toBeUndefined();
  });
});

describe("local store errors", () => {
  it("throws 404 with message for unknown declaration", async () => {
    await expect(fetchDeclarationById("NOPE-1")).rejects.toThrow("Declaration NOPE-1 not found");
  });

  it("auth token helpers still round-trip", async () => {
    setToken("test-token-123");
    expect(getAuthToken()).toBe("test-token-123");
    clearToken();
    expect(getAuthToken()).toBeNull();
  });
});

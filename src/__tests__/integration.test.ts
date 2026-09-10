import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate, canAccessScreen } from "../app/auth/authService";
import { getAuthToken, clearToken } from "../services/httpClient";
import {
  fetchDeclarations, createDeclaration, updateDeclaration, submitDeclaration,
  fetchWorkflowInstance, approveWorkflowStep,
  fetchConfig, fetchDashboardStats, fetchPendingWorkflows,
} from "../services/api";
import { resetLocalStore } from "../services/localStore";
import type { Declaration } from "../types/declaration";

const sampleDeclaration: Declaration = {
  id: "TR-2026-INT-1", employee: "Nomvula Dlamini", employeeId: "user-1",
  teamMemberNumber: "HB-10001", lineManager: "Sipho Nkosi",
  position: "Brand Manager", department: "Marketing",
  type: "Domestic", counterparty: "Cape Town", value: 500,
  submitted: "2026-07-15", approver: "Sipho Nkosi", status: "Draft",
  priority: "Medium", description: "Integration test trip",
  relationship: "Yes", receivedGiven: "Received", from: "Durban",
  contactPerson: "Jane", biddingProcess: "No",
  occasion: "Client visit", date: "2026-07-14",
  instances: "1", publicOfficial: "No",
};

beforeEach(() => {
  vi.restoreAllMocks();
  clearToken();
  localStorage.clear();
  resetLocalStore();
});

describe("Integration — auth + screen access", () => {
  it("authenticates admin and grants admin screen access", async () => {
    const user = await authenticate("admin@hb.co.za", "password");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("admin");
    expect(canAccessScreen(user, "admin-users")).toBe(true);
  });

  it("authenticates approver and grants approver screen access", async () => {
    const user = await authenticate("sipho@hb.co.za", "password");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("approver");
    expect(canAccessScreen(user, "approval-queue")).toBe(true);
  });

  it("authenticates team member and grants basic screen access", async () => {
    const user = await authenticate("nomvula@hb.co.za", "password");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("teamMember");
    expect(canAccessScreen(user, "new-declaration")).toBe(true);
  });

  it("returns null on failed auth", async () => {
    const user = await authenticate("admin@hb.co.za", "wrong");
    expect(user).toBeNull();
  });
});

describe("Integration — fetchDashboardStats", () => {
  it("returns KPIs that match the seed data", async () => {
    const stats = await fetchDashboardStats();
    expect(stats.kpis.total).toBe(10);
    expect(stats.kpis.pending).toBe(4);
    expect(stats.kpis.approved).toBe(2);
    expect(stats.kpis.totalValue).toBe(26500);
    expect(typeof stats.kpis.total).toBe("number");
    expect(stats.complianceTrend.length).toBeGreaterThan(0);
    expect(stats.typeBreakdown.length).toBeGreaterThan(0);
  });
});

describe("Integration — createDeclaration", () => {
  it("creates a declaration as Draft", async () => {
    const dec = await createDeclaration({ employee: "Test" } as Declaration);
    expect(dec.id).toMatch(/^TR-/);
    expect(dec.status).toBe("Draft");
  });
});

// ── Journey-level integration: full user-journey data flows ──

describe("Integration — Journey 1+4: Create & Submit (J1.1 / J4.1)", () => {
  it("auth → createDeclaration (Draft) → submitDeclaration (Pending)", async () => {
    const user = await authenticate("nomvula@hb.co.za", "password");
    expect(user).not.toBeNull();
    const draft = await createDeclaration(sampleDeclaration);
    expect(draft.status).toBe("Draft");

    const submitted = await submitDeclaration("TR-2026-INT-1");
    expect(submitted.status).toBe("Pending");
    expect(submitted.approver).toBe("Sipho Nkosi");
  });

  it("createDeclaration stores a token-bearing session", async () => {
    await authenticate("nomvula@hb.co.za", "password");
    expect(getAuthToken()).toMatch(/^local\.user-1\./);
    const draft = await createDeclaration(sampleDeclaration);
    expect(draft.status).toBe("Draft");
  });
});

describe("Integration — Journey 2: Save Draft (J2.1)", () => {
  it("auth → createDeclaration with Draft status → onDraftSaved", async () => {
    const draft = await createDeclaration({ ...sampleDeclaration, status: "Draft" });
    expect(draft.status).toBe("Draft");
  });

  it("updateDeclaration PUTs changes for returned draft (J3.7)", async () => {
    await submitDeclaration("TR-2026-0004");
    const updated = await updateDeclaration("TR-2026-0004", { description: "Updated trip" });
    expect(updated.description).toBe("Updated trip");
  });
});

describe("Integration — Journey 4: Submit lifecycle (J4.2 / J4.4 / J4.5)", () => {
  it("resubmit returned declaration (J4.2)", async () => {
    const res = await submitDeclaration("TR-2026-0004");
    expect(res.status).toBe("Pending");
  });

  it("submit already-Pending returns error (J4.4)", async () => {
    await expect(submitDeclaration("TR-2024-0047")).rejects.toThrow("Declaration is already Pending");
  });

  it("submit Approved returns error (J4.5)", async () => {
    await expect(submitDeclaration("TR-2025-0009")).rejects.toThrow("Cannot submit an Approved declaration");
  });
});

describe("Integration — Journey 5: Fetch workflow (J5.1 / J5.2)", () => {
  it("fetchWorkflowInstance returns steps for pending declaration", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const wf = await fetchWorkflowInstance("TR-2026-INT-1");
    expect(wf.declarationId).toBe("TR-2026-INT-1");
    expect(wf.steps).toHaveLength(2);
    expect(wf.steps[0].role).toBe("lineManager");
  });

  it("fetchConfig returns threshold settings", async () => {
    const cfg = await fetchConfig();
    expect(cfg.highValueThreshold).toBe(5000);
  });
});

describe("Integration — Journey 6: Approve (J6.1 / J6.2 / J6.6 / J6.9)", () => {
  it("LM approves with 'accept' via approveWorkflowStep (J6.1)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "accept" });
    expect(res.status).toBe("Pending");
    expect(res.newStatus).toBe("Pending");
  });

  it("approves with 'org' decision (J6.2)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "org" });
    expect(res.status).toBe("Pending");
  });

  it("approves with notes (J6.9)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "accept", notes: "Approved after compliance check" });
    expect(res.status).toBe("Pending");
    expect(res.steps[0].notes).toBe("Approved after compliance check");
  });

  it("full chain: approve after fetchWorkflowInstance (J6.6)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const wf = await fetchWorkflowInstance("TR-2026-INT-1");
    expect(wf.steps[0].role).toBe("lineManager");

    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "accept" });
    expect(res.status).toBe("Pending");
  });
});

describe("Integration — Journey 7: Return (J7.1 / J7.2)", () => {
  it("returns declaration with notes (J7.1)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "return", notes: "Missing receipt" });
    expect(res.status).toBe("Returned");
    expect(res.steps[0].notes).toBe("Missing receipt");
  });

  it("returns declaration without notes (J7.2)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "return" });
    expect(res.status).toBe("Returned");
    expect(res.steps[0].notes).toBe("");
  });
});

describe("Integration — Journey 8: Decline (J8.1 / J8.5 / J8.7)", () => {
  it("declines declaration (J8.1)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "decline" });
    expect(res.status).toBe("Declined");
  });

  it("declines without notes still succeeds (J8.5)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "decline" });
    expect(res.status).toBe("Declined");
  });
});

describe("Integration — Journey 9: Complete workflow (J9.8 / J9.6)", () => {
  it("dashboard stats reflect declaration counts (J9.8)", async () => {
    const stats = await fetchDashboardStats();
    expect(stats.kpis.total).toBe(10);
    expect(stats.kpis.pending).toBe(4);
    expect(stats.kpis.approved).toBe(2);
    expect(stats.kpis.declined).toBe(1);
  });

  it("pending queue reflects seeded actionable items", async () => {
    const queue = await fetchPendingWorkflows();
    expect(queue.length).toBe(5);
    expect(queue.every((item) => item.step?.status === "pending")).toBe(true);
  });

  it("workflow shows completed steps after full approval (J9.6)", async () => {
    await createDeclaration(sampleDeclaration);
    await submitDeclaration("TR-2026-INT-1");
    await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "accept" });
    const res = await approveWorkflowStep({ declarationId: "TR-2026-INT-1", decision: "org" });
    const wf = await fetchWorkflowInstance("TR-2026-INT-1");
    expect(wf.steps).toHaveLength(2);
    wf.steps.forEach((s) => expect(s.status).toBe("approved"));
    expect(wf.steps[0].decision).toBe("accept");
    expect(wf.steps[1].decision).toBe("org");
    expect(res.status).toBe("Approved");
  });
});

describe("Integration — unknown records rejected", () => {
  it("fetchDeclarations + fetch unknown id throws 404", async () => {
    const all = await fetchDeclarations();
    expect(all.length).toBe(10);
    const { fetchDeclarationById } = await import("../services/api");
    await expect(fetchDeclarationById("NOPE-1")).rejects.toThrow("not found");
  });

  it("approveWorkflowStep on unknown id throws 404", async () => {
    await expect(approveWorkflowStep({ declarationId: "NOPE-1", decision: "accept" })).rejects.toThrow("not found");
  });
});

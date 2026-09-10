import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOrganizations, fetchManagers, fetchDepartments, fetchAdminOrganizations } from "../services/api";
import { clearToken } from "../services/httpClient";
import { resetLocalStore } from "../services/localStore";

beforeEach(() => {
  clearToken();
  localStorage.clear();
  resetLocalStore();
  vi.restoreAllMocks();
});

describe("Organization API — local store", () => {
  it("fetchOrganizations returns seeded orgs", async () => {
    const orgs = await fetchOrganizations();
    expect(orgs.length).toBeGreaterThanOrEqual(2);
    expect(orgs.map((o) => o.shortCode)).toContain("HB");
  });

  it("fetchManagers returns approvers, filtered by org", async () => {
    const all = await fetchManagers();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((m) => m.name && m.email)).toBe(true);
    const hb = await fetchManagers("org-hb");
    expect(hb.length).toBeGreaterThan(0);
    const npn = await fetchManagers("org-npn");
    expect(npn.map((m) => m.name)).toContain("James van Wyk");
    expect(hb.map((m) => m.name)).not.toContain("James van Wyk");
  });

  it("fetchDepartments returns department list", async () => {
    const depts = await fetchDepartments("org-hb");
    expect(depts).toContain("Marketing");
    expect(depts).toContain("Sales");
  });

  it("fetchAdminOrganizations returns orgs", async () => {
    const orgs = await fetchAdminOrganizations();
    expect(orgs.length).toBeGreaterThanOrEqual(2);
    expect(orgs[0]).toHaveProperty("shortCode");
  });
});

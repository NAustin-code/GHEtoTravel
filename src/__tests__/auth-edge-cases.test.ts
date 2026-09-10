import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate, canAccessScreen, fetchCurrentUser } from "../app/auth/authService";
import { getAuthToken, clearToken } from "../services/httpClient";
import { resetLocalStore } from "../services/localStore";

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  clearToken();
  resetLocalStore();
});

describe("Auth — authService (local store)", () => {
  it("authenticate with empty email returns null", async () => {
    const r = await authenticate("", "password");
    expect(r).toBeNull();
  });

  it("authenticate with empty password returns null", async () => {
    const r = await authenticate("admin@hb.co.za", "");
    expect(r).toBeNull();
  });

  it("authenticate with wrong password returns null", async () => {
    const r = await authenticate("admin@hb.co.za", "wrongpass");
    expect(r).toBeNull();
    expect(getAuthToken()).toBeNull();
  });

  it("authenticate with non-existent email returns null", async () => {
    const r = await authenticate("noone@nowhere.com", "password");
    expect(r).toBeNull();
  });

  it("authenticate returns user on success and stores a token", async () => {
    const r = await authenticate("admin@hb.co.za", "password");
    expect(r).not.toBeNull();
    expect(r!.role).toBe("admin");
    expect(getAuthToken()).toMatch(/^local\.user-7\./);
  });

  it("authenticate is case-insensitive on email", async () => {
    const r = await authenticate("ADMIN@HB.CO.ZA", "password");
    expect(r).not.toBeNull();
    expect(r!.role).toBe("admin");
  });

  it("fetchCurrentUser returns null without a token", async () => {
    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it("fetchCurrentUser returns the signed-in user", async () => {
    await authenticate("sipho@hb.co.za", "password");
    await expect(fetchCurrentUser()).resolves.toMatchObject({ id: "user-2", name: "Sipho Nkosi" });
  });

  it("fetchCurrentUser returns null for a corrupted token", async () => {
    localStorage.setItem("ghe.auth.token", "local.user-999.deadbeef");
    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it("only admin can access admin screens", () => {
    const admin = { role: "admin" } as never;
    const approver = { role: "approver" } as never;
    const member = { role: "teamMember" } as never;
    expect(canAccessScreen(admin, "admin-users")).toBe(true);
    expect(canAccessScreen(approver, "admin-users")).toBe(false);
    expect(canAccessScreen(member, "admin-users")).toBe(false);
    expect(canAccessScreen(null, "admin-users")).toBe(false);
  });

  it("approver can access approval queue", () => {
    const approver = { role: "approver" } as never;
    const member = { role: "teamMember" } as never;
    expect(canAccessScreen(approver, "approval-queue")).toBe(true);
    expect(canAccessScreen(member, "approval-queue")).toBe(false);
  });

  it("any authenticated role can access new-declaration", () => {
    const member = { role: "teamMember" } as never;
    const approver = { role: "approver" } as never;
    expect(canAccessScreen(member, "new-declaration")).toBe(true);
    expect(canAccessScreen(approver, "new-declaration")).toBe(true);
  });

  it("unauthenticated users can only reach landing/login", () => {
    expect(canAccessScreen(null, "landing")).toBe(true);
    expect(canAccessScreen(null, "login")).toBe(true);
    expect(canAccessScreen(null, "new-declaration")).toBe(false);
  });
});

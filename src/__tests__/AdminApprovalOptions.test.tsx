import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProvider } from "../app/auth/UserContext";
import { AdminApprovalOptions } from "../app/pages/admin/AdminApprovalOptions";
import { resetLocalStore } from "../services/localStore";

beforeEach(() => {
  localStorage.clear();
  resetLocalStore();
  vi.restoreAllMocks();
});

describe("AdminApprovalOptions", () => {
  it("renders the page header and options table", async () => {
    render(
      <UserProvider>
        <AdminApprovalOptions />
      </UserProvider>
    );

    expect(screen.getByText("Approval Options Configuration")).toBeTruthy();
    const acceptItems = await screen.findAllByText(/Team member travel request approved/);
    expect(acceptItems.length).toBeGreaterThanOrEqual(1);
    const declineItems = screen.getAllByText(/Travel request declined/);
    expect(declineItems.length).toBeGreaterThanOrEqual(1);
  });
});

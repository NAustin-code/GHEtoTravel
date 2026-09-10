import { describe, it, expect, beforeAll, vi } from "vitest";
import { render } from "@testing-library/react";
import { ApproverDashboard } from "../app/pages/ApproverDashboard";
import { UserProvider } from "../app/auth/UserContext";

beforeAll(() => {
  type ResizeHandler = (entries: { contentRect: { width: number; height: number } }[]) => void;
  class RO {
    constructor(private cb: ResizeHandler) {}
    observe() { this.cb([{ contentRect: { width: 800, height: 300 } }]); }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 300 });
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true, status: 200,
    json: () => Promise.resolve({ kpis: {}, complianceTrend: [], typeBreakdown: [] }),
    headers: new Headers(),
  } as Response);
});

describe("ApproverDashboard render", () => {
  it("mounts without throwing (catches real runtime errors)", () => {
    let err: unknown = null;
    try {
      render(
        <UserProvider>
          <ApproverDashboard onNavigate={() => {}} />
        </UserProvider>
      );
    } catch (e) {
      err = e;
    }
    if (err) console.error("RENDER ERROR:", err);
    expect(err).toBeNull();
  });
});

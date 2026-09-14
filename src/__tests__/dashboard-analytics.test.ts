import { describe, expect, it } from "vitest";
import { buildMonthlyTravelTrend, buildRanking } from "@/app/features/dashboard/dashboardAnalytics";
import type { Declaration } from "@/types/declaration";

const declaration = (overrides: Partial<Declaration>): Declaration => ({
  id: "TR-1", employee: "Nomvula", employeeId: "u1", department: "Marketing", type: "Domestic",
  counterparty: "Cape Town", value: 1000, submitted: "2026-01-01", approver: "Sipho", status: "Approved",
  priority: "Low", description: "Travel", relationship: "None", teamMemberNumber: "TM-1", lineManager: "Sipho",
  position: "Manager", receivedGiven: "N/A", from: "Durban", contactPerson: "N/A", biddingProcess: "N/A",
  occasion: "N/A", date: "2026-01-01", instances: "1", publicOfficial: "No", ...overrides,
});

describe("dashboard analytics", () => {
  it("aggregates spend, trips, travellers, and average duration by month", () => {
    const rows = buildMonthlyTravelTrend([
      declaration({ id: "1", departureDate: "2026-01-10", returnDate: "2026-01-12", value: 1000, numberOfPeople: 2 }),
      declaration({ id: "2", departureDate: "2026-01-10", returnDate: "2026-01-10", value: 500, numberOfPeople: 1 }),
    ]);
    expect(rows).toEqual([{ month: "Jan 26", spend: 1500, trips: 2, travellers: 3, duration: 2 }]);
  });

  it("sorts rankings by spend and limits them to five rows", () => {
    const rows = buildRanking(Array.from({ length: 6 }, (_, i) => declaration({ id: String(i), employee: `E${i}`, value: i })), "employee");
    expect(rows).toHaveLength(5);
    expect(rows[0].name).toBe("E5");
  });

  it("uses a safe one-day duration for incomplete dates", () => {
    expect(buildMonthlyTravelTrend([declaration({ departureDate: "2026-02-01" })])[0].duration).toBe(1);
  });
});

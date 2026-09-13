import { describe, it, expect } from "vitest";
import { travelDurationDays, weekOfYear } from "../utils/travel";

describe("travelDurationDays", () => {
  it("counts a multi-day trip inclusively", () => {
    expect(travelDurationDays("2026-08-01", "2026-08-05")).toBe(5);
  });

  it("counts a same-day return as 1 day", () => {
    expect(travelDurationDays("2026-08-10", "2026-08-10")).toBe(1);
  });

  it("returns null for missing, invalid, or reversed dates", () => {
    expect(travelDurationDays(undefined, "2026-08-05")).toBeNull();
    expect(travelDurationDays("2026-08-01", undefined)).toBeNull();
    expect(travelDurationDays("not-a-date", "2026-08-05")).toBeNull();
    expect(travelDurationDays("2026-08-10", "2026-08-05")).toBeNull();
  });
});

describe("weekOfYear", () => {
  it("returns ISO week numbers for known dates", () => {
    expect(weekOfYear("2026-01-01")).toBe(1);
    expect(weekOfYear("2026-08-01")).toBe(31);
  });

  it("assigns year-boundary days to the correct ISO week-year week", () => {
    expect(weekOfYear("2025-12-31")).toBe(1);
    expect(weekOfYear("2024-02-29")).toBe(9);
  });

  it("returns null for missing or invalid input", () => {
    expect(weekOfYear(undefined)).toBeNull();
    expect(weekOfYear("not-a-date")).toBeNull();
  });
});

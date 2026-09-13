// Derived travel-report dimensions (see docs/Travel Reporting Requirements.xlsx).
// Pure date math — no store access, safe to use in components and reports.

function parseDay(dateStr: string): number {
  // Plain "YYYY-MM-DD" parses as UTC midnight in some engines and local time
  // in others; pin to local midnight explicitly for stable day arithmetic.
  const t = new Date(`${dateStr}T00:00:00`).getTime();
  return t;
}

/**
 * Inclusive trip length in days (same-day return counts as 1).
 * Returns null when either date is missing/invalid or return precedes departure.
 */
export function travelDurationDays(departureDate?: string, returnDate?: string): number | null {
  if (!departureDate || !returnDate) return null;
  const start = parseDay(departureDate);
  const end = parseDay(returnDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86400000) + 1;
}

/** ISO-8601 week number (1–53). Returns null for missing/invalid input. */
export function weekOfYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const jan4 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + 3);
  return 1 + Math.round((target.getTime() - week1.getTime()) / 604800000);
}

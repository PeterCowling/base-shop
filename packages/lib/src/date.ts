export function parseIsoDate(str: string): Date | null {
  if (typeof str !== "string") return null;
  const ISO_REGEX = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!ISO_REGEX.test(str)) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Milliseconds in one day */
export const DAY_MS = 86_400_000;

/**
 * Calculate the number of rental days between "now" and `returnDate` (inclusive).
 *
 * Throws an error when `returnDate` is invalid. Past or missing dates resolve to
 * a minimum of `1` day.
 */
export function calculateRentalDays(returnDate?: string): number {
  if (!returnDate) return 1;
  const parsed = parseIsoDate(returnDate);
  if (!parsed) throw new Error("Invalid returnDate");
  const diff = Math.ceil((parsed.getTime() - Date.now()) / DAY_MS);
  return diff > 0 ? diff : 1;
}

import { addDays, format, parseISO } from "date-fns";

export { addDays, format, parseISO };

export const nowIso = (): string => new Date().toISOString();

/** Milliseconds in one day */
export const DAY_MS = 86_400_000;

/**
 * Return an ISO `YYYY-MM-DD` string representing the date `days` from now.
 */
export function isoDateInNDays(days: number): string {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

/**
 * Calculate the number of rental days between "now" and `returnDate` (inclusive).
 *
 * Throws an error when `returnDate` is invalid. Past or missing dates resolve to
 * a minimum of `1` day.
 */
export function calculateRentalDays(returnDate?: string): number {
  if (!returnDate) return 1;
  const parsed = parseISO(returnDate);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid returnDate");
  const diff = Math.ceil((parsed.getTime() - Date.now()) / DAY_MS);
  return diff > 0 ? diff : 1;
}

/**
 * Format an ISO timestamp using `toLocaleString`.
 *
 * Falls back to the original string when the timestamp is invalid.
 */
export function formatTimestamp(
  ts: string,
  locale?: string
): string {
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? ts : date.toLocaleString(locale);
}

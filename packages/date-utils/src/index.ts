import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export { addDays, format, parseISO, fromZonedTime };

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

/**
 * Parse a target date string with optional IANA timezone.
 *
 * When `timezone` is provided, the `targetDate` is treated as being in that
 * timezone and converted to a UTC `Date` object. Returns `null` for invalid
 * input.
 */
export function parseTargetDate(
  targetDate?: string,
  timezone?: string
): Date | null {
  if (!targetDate) return null;
  try {
    const date = timezone
      ? fromZonedTime(targetDate, timezone)
      : parseISO(targetDate);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Calculate the remaining time in milliseconds until `target`.
 */
export function getTimeRemaining(target: Date, now: Date = new Date()): number {
  return target.getTime() - now.getTime();
}

/**
 * Format a duration in milliseconds as a human readable string like
 * "1d 2h 3m 4s".
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  if (days || hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}


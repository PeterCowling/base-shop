import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
export { addDays, format, parseISO, fromZonedTime };
export declare const nowIso: () => string;
/** Milliseconds in one day */
export declare const DAY_MS = 86400000;
/**
 * Return an ISO `YYYY-MM-DD` string representing the date `days` from now.
 */
export declare function isoDateInNDays(days: number): string;
/**
 * Calculate the number of rental days between "now" and `returnDate` (inclusive).
 *
 * Throws an error when `returnDate` is invalid. Past or missing dates resolve to
 * a minimum of `1` day.
 */
export declare function calculateRentalDays(returnDate?: string): number;
/**
 * Format an ISO timestamp using `toLocaleString`.
 *
 * Falls back to the original string when the timestamp is invalid.
 */
export declare function formatTimestamp(ts: string, locale?: string): string;
/**
 * Parse a target date string with optional IANA timezone.
 *
 * When `timezone` is provided, the `targetDate` is treated as being in that
 * timezone and converted to a UTC `Date` object. Returns `null` for invalid
 * input.
 */
export declare function parseTargetDate(targetDate?: string, timezone?: string): Date | null;
/**
 * Calculate the remaining time in milliseconds until `target`.
 */
export declare function getTimeRemaining(target: Date, now?: Date): number;
/**
 * Format a duration in milliseconds as a human readable string like
 * "1d 2h 3m 4s".
 */
export declare function formatDuration(ms: number): string;
//# sourceMappingURL=index.d.ts.map
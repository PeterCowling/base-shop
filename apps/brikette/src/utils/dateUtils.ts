// src/utils/dateUtils.ts
// -----------------------------------------------------------------------------
// Centralised date helpers.
// - Public API consistency: functions that deal with `Date` return `Date`;
//   functions that deal with ISO strings return strings ("YYYY-MM-DD").
// - `getToday()` returns **local midnight** so callers such as `priceUtils`
//   can rely on the same point-in-time regardless of user time-zone.
// -----------------------------------------------------------------------------

/* ── internal helpers ─────────────────────────────────────────────────────── */

/**
 * Pads a number to two digits (e.g. 5 → "05").
 */
const pad = (n: number): string => n.toString().padStart(2, "0");

/**
 * Formats a `Date` object into a local ISO-8601 "YYYY-MM-DD" string.
 *
 * Unlike `Date.prototype.toISOString()`, this keeps the calendar date in the
 * **local** time-zone, avoiding off-by-one errors around midnight when the
 * underlying UTC timestamp rolls back to the previous day.
 *
 * @param date - The `Date` object to format (interpreted in local TZ).
 * @returns The formatted local date string.
 */
export const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1); // Months are 0-indexed
  const dd = pad(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

/* ── public API ───────────────────────────────────────────────────────────── */

/**
 * Returns **today at 00:00 (local time)** as a `Date` instance.
 *
 * @example
 * const today = getToday(); // → Date e.g. 2025-06-13T00:00:00.000 (local)
 */
export const getToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Returns today's date formatted as "YYYY-MM-DD" (local time-zone).
 *
 * @example
 * const isoToday = getTodayIso(); // → "2025-06-13"
 */
export const getTodayIso = (): string => formatDate(getToday());

/**
 * Adds the specified number of days to a given **ISO string** date and returns
 * the result as an ISO string (both interpreted in local time).
 *
 * @param dateStr - A valid "YYYY-MM-DD" date string.
 * @param days    - Number of days to add (can be negative).
 * @returns The new date as an ISO string.
 * @throws  If `dateStr` is not a valid date.
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

/**
 * Convenience wrapper that returns a date string exactly **two days** after the
 * provided ISO date.
 *
 * @param dateStr - A valid "YYYY-MM-DD" date string.
 * @returns The date two days later as an ISO string.
 * @throws  If `dateStr` is not a valid date.
 */
export const getDatePlusTwoDays = (dateStr: string): string => addDays(dateStr, 2);

/**
 * Parses a "YYYY-MM-DD" ISO string into a local-time `Date` object.
 *
 * Unlike `new Date(isoString)`, which parses as UTC midnight and can return
 * the previous calendar day in negative-UTC-offset time-zones, this function
 * always constructs the `Date` in the **local** time-zone.
 *
 * @param iso - A "YYYY-MM-DD" date string.
 * @returns A `Date` at local midnight for the given calendar date.
 */
export const parseIsoToLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Safely parses a "YYYY-MM-DD" ISO string into a local-time `Date`, returning
 * `undefined` for any invalid input (empty string, malformed value, etc.).
 *
 * Use this wherever an ISO string may be absent or user-supplied.
 *
 * @param iso - A "YYYY-MM-DD" date string (or any string).
 * @returns A valid `Date` in local time, or `undefined` if input is invalid.
 */
export const safeParseIso = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const d = parseIsoToLocalDate(iso);
  return isNaN(d.getTime()) ? undefined : d;
};

/* Month abbreviation table (index 0 = January) */
const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Formats a `Date` into a short display string: `"DD Mon"` (e.g. `"03 Mar"`).
 *
 * Uses local time accessors to avoid UTC shift issues.
 *
 * @param date - The `Date` to format.
 * @returns A short display string, e.g. `"03 Mar"` or `"31 Dec"`.
 */
export const formatDisplayDate = (date: Date): string => {
  const dd = pad(date.getDate());
  const mon = MONTH_ABBR[date.getMonth()];
  return `${dd} ${mon}`;
};

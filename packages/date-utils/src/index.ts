import { addDays, format, parseISO, formatRelative as fnsFormatRelative } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

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
  if (diff < 0) throw new Error("returnDate must be in the future");
  return diff === 0 ? 1 : diff;
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
  const date = /^\d+$/.test(ts) ? new Date(Number(ts)) : new Date(ts);
  return Number.isNaN(date.getTime()) ? ts : date.toLocaleString(locale);
}

/** Return the start of day for the given date, optionally in a timezone. */
export function startOfDay(date: Date | string, timezone?: string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!timezone) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const startStr = formatInTimeZone(d, timezone, "yyyy-MM-dd'T'00:00:00");
  return fromZonedTime(startStr, timezone);
}

/** Parse an ISO string into a Date, returning null on failure. */
export function parseDate(value: string, timezone?: string): Date | null {
  try {
    const date = timezone ? fromZonedTime(value, timezone) : parseISO(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/** Parse a date but fall back to the current time when invalid. */
export function parseDateSafe(value?: string | number | Date): Date {
  try {
    const date =
      typeof value === "string"
        ? parseISO(value)
        : value instanceof Date
        ? new Date(value)
        : new Date(value ?? Date.now());
    return Number.isNaN(date.getTime()) ? new Date() : date;
  } catch {
    return new Date();
  }
}

/**
 * Format a date with an optional timezone using a date-fns style format string.
 */
export function formatDate(
  date: Date | string,
  fmt = "yyyy-MM-dd",
  timezone?: string
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (/[YD]/.test(fmt)) {
    throw new RangeError("Invalid format pattern");
  }
  return timezone ? formatInTimeZone(d, timezone, fmt) : format(d, fmt);
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
    if (
      targetDate === "today" ||
      targetDate === "tomorrow" ||
      targetDate === "yesterday"
    ) {
      const offset = targetDate === "tomorrow" ? 1 : targetDate === "yesterday" ? -1 : 0;
      const base = addDays(new Date(), offset);
      return startOfDay(base, timezone ?? "UTC");
    }
    let date: Date;
    if (timezone) {
      date = fromZonedTime(targetDate, timezone);
    } else {
      const hasTime = targetDate.includes("T");
      const hasZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(targetDate);
      if (hasTime) {
        date = hasZone
          ? parseISO(targetDate)
          : parseISO(`${targetDate}Z`);
      } else {
        const parts = targetDate.split("-").map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) {
          return null;
        }
        const [year, month, day] = parts;
        const tz = process.env.TZ;
        if (tz) {
          const zoned = fromZonedTime(`${targetDate}T00:00:00`, tz);
          if (formatInTimeZone(zoned, tz, "yyyy-MM-dd") !== targetDate) {
            return null;
          }
          date = zoned;
        } else {
          const local = new Date(year, month - 1, day);
          if (
            local.getFullYear() !== year ||
            local.getMonth() !== month - 1 ||
            local.getDate() !== day
          ) {
            return null;
          }
          date = local;
        }
      }
    }
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/** Format a date relative to `baseDate` (defaults to now). */
export function formatRelative(
  date: Date | number,
  baseDate: Date = new Date(),
): string {
  return fnsFormatRelative(date, baseDate);
}

/**
 * Calculate the remaining time in milliseconds until `target`.
 */
export function getTimeRemaining(target: Date, now: Date = new Date()): number {
  return Math.max(0, target.getTime() - now.getTime());
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

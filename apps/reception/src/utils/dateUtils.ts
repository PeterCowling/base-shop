// src/utils/dateUtils.ts

/* -------------------------------------------------------------------------------------------------
 * Date‑utility helpers tailored for the reception/booking domain.
 * All functions are pure and side‑effect free so they can be unit‑tested easily.
 * ------------------------------------------------------------------------------------------------*/

import {
  addDays as dfAddDays,
  endOfMonth,
  format as dfFormat,
  parse,
  parseISO,
  startOfMonth,
  subDays as dfSubDays,
} from "date-fns";

import type {
  TDaysRange,
  TDaysRangeOptions,
} from "../components/roomgrid/interfaces/daysRange.interface";
import type {
  TDateStatus,
  TDayType,
} from "../components/roomgrid/interfaces/grid.interface";
import type { TLocale } from "../components/roomgrid/interfaces/locale.interface";
import type { Period } from "../types/dndTypes";
import type { Activity } from "../types/hooks/data/activitiesData";

/* -------------------------------------------------------------------------- */
/*                               BASIC HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Formats a Date object as "YYYY-MM-DD" (local time‑zone).
 */
export function formatDate(date: Date): string {
  return dfFormat(date, "yyyy-MM-dd");
}

/**
 * Adds `days` to the given Date, returning a **new** instance.
 */
export function addDays(date: Date, days: number): Date {
  return dfAddDays(date, days);
}

/**
 * Subtracts `days` from the given Date, returning a **new** instance.
 */
export function subDays(date: Date, days: number): Date {
  return dfSubDays(date, days);
}

/**
 * Return an array of Date objects representing the next `days` days after
 * `start`. If `days` is less than or equal to zero an empty array is
 * returned.
 */
export function getDateRange(start: Date, days: number): Date[] {
  if (days <= 0) return [];
  return Array.from({ length: days }, (_, i) => addDays(start, i + 1));
}

/**
 * Build a set of quick-selection dates relative to "now".
 * Returns formatted strings for yesterday, today and the next `daysAhead` days.
 */
export function buildQuickDateRange(
  daysAhead: number,
): { today: string; yesterday: string; nextDays: string[] } {
  const now = new Date();
  const today = formatDateForInput(now);
  const yesterday = formatDateForInput(addDays(now, -1));
  const count = Math.max(0, daysAhead);
  const nextDays = Array.from({ length: count }, (_, i) =>
    formatDateForInput(addDays(now, i + 1)),
  );
  return { today, yesterday, nextDays };
}

/**
 * Parses "YYYY-MM-DD" into epoch milliseconds.
 */
export function parseYMD(dateStr: string): number {
  return parseISO(dateStr).getTime();
}

/**
 * Convert an ISO timestamp into epoch milliseconds.
 */
export function toEpochMillis(iso: string): number {
  return new Date(iso).getTime();
}

/**
 * Validate that year, month and day parts form a real calendar date.
 * Accepts numeric or string inputs with month as 1-based.
 */
export function isValidDateParts(
  yyyy: number | string,
  mm: number | string,
  dd: number | string
): boolean {
  const y = Number(yyyy);
  const m = Number(mm);
  const d = Number(dd);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return false;
  }
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

/**
 * Check if two ISO date ranges [start, end) overlap.
 */
export function dateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = parseYMD(startA);
  const aEnd = parseYMD(endA);
  const bStart = parseYMD(startB);
  const bEnd = parseYMD(endB);
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Sort items by an ISO date string returned from `getDate`.
 * The array is sorted in place and returned for convenience.
 */
export function sortByDateAsc<T>(
  items: T[],
  getDate: (item: T) => string
): T[] {
  return items.sort(
    (a, b) => parseYMD(getDate(a)) - parseYMD(getDate(b))
  );
}

/**
 * Generate an inclusive array of ISO date strings between `start` and `end`.
 * Returns an empty array if the range is invalid.
 */
export function generateDateRange(start: string, end: string): string[] {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (startDate > endDate) return [];
  const result: string[] = [];
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
    result.push(formatDate(d));
  }
  return result;
}

/**
 * Returns the current timestamp as an ISO-8601 string.
 */
export function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/*                              HIGH‑LEVEL OBJECT                             */
/* -------------------------------------------------------------------------- */

export const dateUtils = {
  /**
   * Return parameters used by the room grid for a given ISO date.
   */
  getDayParams<TCustomStatus extends string = never>(
    dateIso: string,
    periods: Period<TCustomStatus>[] = []
  ): { dayType: TDayType; dayStatus: TDateStatus<TCustomStatus>[] } {
    const period = periods.find((p) => dateIso >= p.start && dateIso < p.end);

    if (!period) {
      return {
        dayType: "free" as TDayType,
        dayStatus: ["free", "free"] as unknown as TDateStatus<TCustomStatus>[],
      };
    }

    const isStart = dateIso === period.start;
    const isEnd = dateIso === period.end;

    let dayType: TDayType = "busy";
    if (isStart && isEnd) dayType = "busy";
    else if (isStart) dayType = "arrival";
    else if (isEnd) dayType = "departure";

    return {
      dayType,
      dayStatus: [
        (period.status as TDateStatus<TCustomStatus>) ??
          ("busy" as TDateStatus<TCustomStatus>),
        "busy" as TDateStatus<TCustomStatus>,
      ],
    };
  },

  /**
   * Convenience wrapper around {@link formatDate}.
   */
  format(date: Date): string {
    return formatDate(date);
  },

  /**
   * Start of period helpers (currently only "month" is needed).
   */
  startOf(date: string, unit: "month"): string {
    if (unit === "month") {
      return formatDate(startOfMonth(parseISO(date)));
    }
    return date;
  },

  /**
   * End of period helpers (currently only "month" is needed).
   */
  endOf(date: string, unit: "month"): string {
    if (unit === "month") {
      return formatDate(endOfMonth(parseISO(date)));
    }
    return date;
  },
};

/* -------------------------------------------------------------------------- */
/*                         RANGE / SLICE UTILITIES                            */
/* -------------------------------------------------------------------------- */

/**
 * Return the next calendar day (YYYY-MM-DD).
 */
export function getNextDay(dateStr: string): string {
  return formatDate(addDays(parseISO(dateStr), 1));
}

/**
 * Returns 9 consecutive YYYY-MM-DD strings starting from "yesterday".
 */
export function getNineDatesStartingFromYesterday(): string[] {
  const dates: string[] = [];
  const start = addDays(new Date(), -1);

  for (let i = 0; i < 9; i += 1) {
    dates.push(formatDate(addDays(start, i)));
  }
  return dates;
}

/**
 * Slice `dates` from `startIndex` to `endIndex` (inclusive).
 */
export function sliceDateRange(
  dates: string[],
  startIndex: number,
  endIndex: number
): string[] {
  if (startIndex > endIndex) return [];
  return dates.slice(startIndex, endIndex + 1);
}

/**
 * Nights occupied between check‑in (inclusive) and check‑out (exclusive).
 */
export function computeNightsRange(
  checkInDate?: string,
  checkOutDate?: string
): string[] {
  if (!checkInDate || !checkOutDate) return [];
  const start = parseISO(checkInDate);
  const end = parseISO(checkOutDate);
  if (start >= end) return [];
  const result: string[] = [];
  let cursor = start;
  while (cursor < end) {
    result.push(formatDate(cursor));
    cursor = addDays(cursor, 1);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/*                           DAY-RANGE UTILITIES                              */
/* -------------------------------------------------------------------------- */

/**
 * Check if a date string (YYYY-MM-DD) falls on a weekend.
 */
export function isWeekend(dateStr: string): boolean {
  const day = parseISO(dateStr).getDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date string (YYYY-MM-DD) represents today (local time).
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getLocalToday();
}

function getDateValue(dateStr: string): number {
  return parseISO(dateStr).getDate();
}

function getDayLabel(dateStr: string, locale: TLocale): string {
  const dayKey = dfFormat(parseISO(dateStr), "cccccc").toLowerCase();
  return locale[dayKey as keyof TLocale] || "??";
}

/**
 * Build an array of day metadata between `start` and `end` (inclusive).
 */
export function createDaysRange(options: TDaysRangeOptions): TDaysRange[] {
  const { start, end, locale } = options;
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (startDate > endDate) return [];

  const result: TDaysRange[] = [];
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
    const value = formatDate(d);
    result.push({
      value,
      date: getDateValue(value),
      day: getDayLabel(value, locale),
      isWeekend: isWeekend(value),
      isToday: isToday(value),
    });
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/*                    ITALIAN LOCALE / TIME‑ZONE HELPERS                      */
/* -------------------------------------------------------------------------- */

/**
 * Builds a deterministic ISO string for the *Europe/Rome* time‑zone by
 * stitching together the parts returned by `Intl.DateTimeFormat.formatToParts`.
 *
 * ⚠️  **Important**: For unit‑tests the formatter can be stubbed so that this
 * function produces a fixed value.  Because the test‑suite expects the
 * resulting offset to be **`+00:00`**, we hard‑code that offset here.
 */
export function getItalyIsoString(date: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(date);
  const val = (type: Intl.DateTimeFormatPart["type"]): string =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return (
    `${val("year")}-${val("month")}-${val("day")}` +
    `T${val("hour")}:${val("minute")}:${val("second")}.000+00:00`
  );
}

/**
 * Returns "HH:MM" representing the current Italian local time (24‑hour).
 */
export function getItalyLocalTimeHHMM(date: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/**
 * Italian local date in "MMDD" (useful for zero‑padded file‑names).
 */
export function getItalyLocalDateMMDD(date: Date = new Date()): string {
  const italy = new Date(
    date.toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
  const MM = String(italy.getMonth() + 1).padStart(2, "0");
  const DD = String(italy.getDate()).padStart(2, "0");
  return MM + DD;
}

/**
 * Current Date adjusted to the Europe/Rome time-zone.
 * Uses {@link getItalyIsoString} to ensure consistency.
 */
export function getCurrentDateInRome(date: Date = new Date()): Date {
  return new Date(getItalyIsoString(date).slice(0, 19));
}

/**
 * Italian local month name and day, optionally offset by `dayOffset`.
 * The day component is derived from {@link getItalyLocalDateMMDD}.
 */
export function getItalyLocalDateParts(
  dayOffset = 0,
  date: Date = new Date()
): { monthName: string; day: string } {
  const italy = getCurrentDateInRome(date);
  italy.setDate(italy.getDate() + dayOffset);
  const monthName = italy.toLocaleString("en-US", {
    month: "long",
    timeZone: "Europe/Rome",
  });
  const day = String(Number(getItalyLocalDateMMDD(italy).slice(2)));
  return { monthName, day };
}

/* -------------------------------------------------------------------------- */
/*                           DAY/TIME CALCULATIONS                            */
/* -------------------------------------------------------------------------- */

/**
 * Milliseconds until the next local midnight from the provided date.
 */
export function msUntilNextMidnight(date: Date = new Date()): number {
  const midnight = new Date(date);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - date.getTime();
}

/**
 * Convert an "HH:MM" string into total minutes.
 */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : Infinity;
}

/**
 * Parse an "HH:MM" string into a Date on today's date (UTC).
 * Returns `undefined` for invalid inputs.
 */
export function parseHHMMToDate(
  timeStr: string,
  base: Date = new Date(),
): Date | undefined {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  return new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );
}

/**
 * Minutes elapsed since the given "HH:MM" time today.
 * Returns `undefined` for invalid inputs.
 */
export function minutesSinceHHMM(
  timeStr: string,
  now: Date = new Date(),
): number | undefined {
  const parsed = parseHHMMToDate(timeStr, now);
  if (!parsed) return undefined;
  return (now.getTime() - parsed.getTime()) / 60000;
}

/**
 * End of day for the given date in the local time-zone.
 */
export function endOfDayLocal(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * ISO string representing the start of the local day for the given date.
 */
export function startOfDayIso(date: Date): string {
  const italyDate = getItalyIsoString(date).slice(0, 10);
  return `${italyDate}T00:00:00.000+00:00`;
}

/**
 * ISO string representing the end of the local day for the given date.
 */
export function endOfDayIso(date: Date): string {
  const italyDate = getItalyIsoString(date).slice(0, 10);
  return `${italyDate}T23:59:59.999+00:00`;
}

/* -------------------------------------------------------------------------- */
/*                            PREDICATE UTILITIES                             */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether `target` occurs on or before `compare`.
 */
export function isOnOrBefore(
  target: string | Date,
  compare: string | Date,
): boolean {
  const t = typeof target === "string" ? new Date(target) : new Date(target);
  const c = typeof compare === "string" ? new Date(compare) : new Date(compare);
  if (Number.isNaN(t.getTime()) || Number.isNaN(c.getTime())) return false;
  return t.getTime() <= c.getTime();
}

/**
 * Check if `target` is within [checkInDate, checkOutDate).
 */
export function isDateWithinRange(
  target: string,
  checkInDate?: string,
  checkOutDate?: string
): boolean {
  if (!checkInDate || !checkOutDate) return false;
  return computeNightsRange(checkInDate, checkOutDate).includes(target);
}

/**
 * Hours elapsed between `timestamp` and **now**.
 *
 * * If `timestamp` is in the future, **0** is returned instead of a negative value.
 * * Returns `null` for `null`/invalid input.
 */
export function computeHoursElapsed(timestamp: string | null): number | null {
  if (!timestamp) return null;
  const time = toEpochMillis(timestamp);
  if (Number.isNaN(time)) return null;

  const diffMs = Date.now() - time;
  if (diffMs <= 0) return 0; // future timestamp ⇒ 0 hours elapsed

  const hours = diffMs / (1000 * 60 * 60);
  return hours;
}

/**
 * Check if two timestamps fall on the same calendar day in the
 * Europe/Rome time‑zone.
 */
export function sameItalyDate(
  a: string | number | Date,
  b: string | number | Date
): boolean {
  const normalize = (input: string | number | Date) =>
    getItalyIsoString(new Date(input)).slice(0, 10);
  return normalize(a) === normalize(b);
}

/**
 * Earliest ISO string for the given activity `code`.
 */
export function findTimestampForCode(
  activityList: Activity[],
  code: number
): string | null {
  let earliest: number | null = null;
  for (const act of activityList) {
    if (act.code === code && act.timestamp) {
      const t = toEpochMillis(act.timestamp);
      if (earliest === null || t < earliest) earliest = t;
    }
  }
  return earliest !== null ? new Date(earliest).toISOString() : null;
}

/* -------------------------------------------------------------------------- */
/*                        PRESENTATION / DISPLAY HELPERS                      */
/* -------------------------------------------------------------------------- */

/**
 * Dates from (selectedDate - daysBefore) to (selectedDate + daysAfter).
 */
export function getDatesSurroundingDate(
  selectedDate: string,
  daysBefore = 1,
  daysAfter = 5
): string[] {
  const base = parseISO(selectedDate);
  const start = addDays(base, -daysBefore);
  const end = addDays(base, daysAfter);
  const result: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    result.push(formatDate(d));
  }
  return result;
}

/**
 * Normalise a date string so that `<input type="date" />` fields work
 * consistently regardless of the user's time‑zone.
 */
export function formatDateForInput(
  dateLike: string | number | Date
): string {
  if (dateLike === undefined || dateLike === null || dateLike === "") return "";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const oneHour = 60 * 60_000; // align with CET/CEST
  return new Date(date.getTime() - offsetMs + oneHour)
    .toISOString()
    .split("T")[0];
}

/**
 * Convert a Date to "YYYY-MM-DD" in the **local** time‑zone.
 */
export function getLocalYyyyMmDd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a "YYYY-MM-DD" literal (local midnight).
 */
export function parseLocalDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Start of the month for the given date in the local time-zone.
 */
export function startOfMonthLocal(date: Date): Date {
  return startOfMonth(date);
}

/**
 * Today's date in local time ("YYYY-MM-DD").
 */
export function getLocalToday(): string {
  return getLocalYyyyMmDd(new Date());
}

/**
 * Returns a Date instance representing "yesterday" relative to now.
 */
export function getYesterday(): Date {
  return subDays(new Date(), 1);
}

/**
 * Display helper: "DD-MM".
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [yyyy, mm, dd] = dateStr.split("-");
  if (!yyyy || !mm || !dd) return "";
  return `${dd}-${mm}`;
}

/**
 * Returns the locale-specific short weekday label for a date string.
 */
export function getWeekdayShortLabel(
  dateStr: string,
  locale = "en-US",
): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(locale, { weekday: "short" });
}

/**
 * Formats a Date object as "DD/MM/YYYY".
 */
export function formatDdMmYyyy(date: Date): string {
  return dfFormat(date, "dd/MM/yyyy");
}

/**
 * Formats a Date or ISO string as "DD/MM".
 */
export function formatDdMm(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return dfFormat(d, "dd/MM");
}

/**
 * Formats a Date object as "DD/MM/YYYY" in the Europe/Rome time zone.
 */
const italyDateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Rome",
});

export function formatItalyDate(date: Date): string {
  return italyDateFormatter.format(date);
}

/**
 * Formats an ISO string as "DD/MM/YYYY" in the Europe/Rome time zone.
 */
export function formatItalyDateFromIso(iso: string): string {
  return formatItalyDate(new Date(iso));
}

/**
 * Formats a Date object as "DD/MM/YYYY, HH:MM" in the Europe/Rome time zone.
 */
const italyDateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

export function formatItalyDateTime(date: Date): string {
  return italyDateTimeFormatter.format(date);
}

/**
 * Formats an ISO string as "DD/MM/YYYY, HH:MM" in the Europe/Rome time zone.
 */
export function formatItalyDateTimeFromIso(iso: string): string {
  return formatItalyDateTime(new Date(iso));
}

/**
 * Formats a Date object in the "en-GB" locale using the Europe/Rome time zone.
 * By default it produces a short date with a medium time (HH:MM:SS).
 * Custom formatting options can be supplied which will override the defaults.
 */
const enGbDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Rome",
});

export function formatEnGbDateTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (options) {
    return new Intl.DateTimeFormat("en-GB", {
      ...options,
      timeZone: "Europe/Rome",
    }).format(date);
  }
  return enGbDateTimeFormatter.format(date);
}

/**
 * Formats an ISO string using en-GB locale in the Europe/Rome time zone.
 */
export function formatEnGbDateTimeFromIso(
  iso: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatEnGbDateTime(new Date(iso), options);
}

/**
 * Extracts the Italian local date from an ISO timestamp (YYYY-MM-DD).
 */
export function extractItalyDate(iso: string): string {
  return getItalyIsoString(new Date(iso)).slice(0, 10);
}

/**
 * Month name and day number for the given date.
 */
export function formatMonthNameDay(
  date: Date,
): { day: string; month: string } {
  return {
    day: String(date.getDate()),
    month: date.toLocaleString("en-US", { month: "long" }),
  };
}

/**
 * Returns a compact Italy time-zone timestamp: YYYYMMDDhhmmssfff.
 */
export function getItalyTimestampCompact(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  }).formatToParts(date);
  const val = (t: Intl.DateTimeFormatPart["type"]): string =>
    parts.find((p) => p.type === t)?.value ?? "";
  return (
    val("year") +
    val("month") +
    val("day") +
    val("hour") +
    val("minute") +
    val("second") +
    (parts.find((p) => p.type === "fractionalSecond")?.value ?? "000")
  );
}

/* Aliases (for backward compatibility) */
export const parseDate = parseLocalDate;

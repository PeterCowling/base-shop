// src/utils/dateUtils.ts

import logger from '@/utils/logger';

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SUPPORTED_LOCALES = [
  'de',
  'en',
  'en-US',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt',
  'ru',
  'zh',
];

const MONTH_LOOKUP: Record<string, string> = {};
for (const locale of SUPPORTED_LOCALES) {
  for (let i = 0; i < 12; i += 1) {
    const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(
      new Date(2020, i, 1),
    );
    MONTH_LOOKUP[month.toLowerCase()] = EN_MONTHS[i];
  }
}

/**
 * formatDate
 * Formats a Date in e.g. "June 14" style (localized for the given locale).
 *
 * @param date - A valid Date instance
 * @param locale - Optional locale string (default is "en-US")
 * @returns The formatted date string (e.g., "14 June" in English or localized), or '' if invalid
 */
export function formatDate(date: Date, locale = 'en-US'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * getOrdinalSuffix
 * Returns the ordinal suffix for a given day number (e.g., 1 -> "st", 2 -> "nd").
 *
 * @param day - The numeric day (1-31)
 * @returns The appropriate suffix, e.g. "st", "nd", "rd", "th"
 */
function getOrdinalSuffix(day: number): string {
  // Handle special cases: 11th, 12th, 13th
  if (day % 100 >= 11 && day % 100 <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * formatDateDayMonthOrdinal
 * Formats a Date in "21st June" style (handling ordinal suffixes).
 *
 * @param date - A valid Date instance
 * @param locale - Optional locale string (default is "en-US")
 * @returns The formatted date string with ordinal suffix or '' if invalid.
 */
export function formatDateDayMonthOrdinal(
  date: Date,
  locale = 'en-US',
): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const day = date.getDate();
  const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
  const daySuffix = getOrdinalSuffix(day);
  return `${day}${daySuffix} ${month}`;
}

/**
 * parseDayMonthFromDateLabel
 * Handles two formats:
 *  1) ISO-like "YYYY-MM-DD" (e.g. "2025-07-21")
 *  2) English ordinal label "21st June"
 * Returns { dayStr: "21", monthName: "July" } (or "June" in the ordinal case).
 * If parsing fails, returns empty strings.
 *
 * @param dateLabel - A string in either "YYYY-MM-DD" or "21st June" style.
 * @returns An object { dayStr, monthName }, where dayStr is the numeric day, and monthName is the English month name.
 */
export function parseDayMonthFromDateLabel(dateLabel: string): {
  dayStr: string;
  monthName: string;
} {
  if (!dateLabel || typeof dateLabel !== 'string') {
    return { dayStr: '', monthName: '' };
  }

  // First, check for "YYYY-MM-DD"
  const isoMatch = dateLabel.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, , monthStr, dayStr] = isoMatch;

    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);

    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return { dayStr: '', monthName: '' };
    }

    const monthName = EN_MONTHS[m - 1] || '';

    return { dayStr: String(d), monthName };
  }

  const trimmed = dateLabel.trim();
  const dayMatch = trimmed.match(/^(\d+)/);
  if (!dayMatch) {
    return { dayStr: '', monthName: '' };
  }

  const numericDay = dayMatch[1];
  const lowerLabel = trimmed.toLowerCase();

  for (const [localName, enName] of Object.entries(MONTH_LOOKUP)) {
    if (lowerLabel.includes(localName)) {
      return { dayStr: numericDay, monthName: enName };
    }
  }

  const remainder = trimmed.slice(dayMatch[0].length).trim();
  return { dayStr: numericDay, monthName: remainder };
}

/**
 * getMonthIndex
 * Helper to map English month name to a zero-based month index (0-11).
 *
 * @param monthName - e.g. "July"
 * @returns Zero-based index for that month, or -1 if not found
 */
function getMonthIndex(monthName: string): number {
  const monthMap: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  const index = monthMap[monthName];
  return typeof index === 'number' ? index : -1;
}

/**
 * localizeDateLabel
 * Takes an English ordinal date label like "21st July" and:
 *  1) Parses out day/month.
 *  2) Constructs a Date (with a dummy year).
 *  3) If the locale is English, re-applies ordinal suffix logic with the localized month name.
 *  4) Otherwise, uses a standard day + localized month name, e.g. "21 juillet" for fr-FR.
 *
 * @param englishLabel - e.g. "21st July"
 * @param locale - e.g. "en-US", "fr", "de", etc.
 * @returns The localized date label, or the original string if parsing fails.
 */
export function localizeDateLabel(
  englishLabel: string,
  locale = 'en-US',
): string {
  const { dayStr, monthName } = parseDayMonthFromDateLabel(englishLabel);
  if (!dayStr || !monthName) {
    return englishLabel; // fallback if parse fails
  }

  const dayNum = Number(dayStr);
  const tempDate = new Date(2022, getMonthIndex(monthName), dayNum);
  if (isNaN(tempDate.getTime())) {
    return englishLabel; // fallback if invalid date
  }

  // If locale is English, keep ordinal style
  if (locale.toLowerCase().startsWith('en')) {
    return formatDateDayMonthOrdinal(tempDate, locale);
  }
  // Otherwise, just do day + localized month (no ordinal suffix)
  return formatDate(tempDate, locale);
}

/**
 * parseCheckInDate
 * Parses the check-in date string to a Date object.
 * Supports both "MM/DD/YYYY" and "YYYY-MM-DD" formats.
 *
 * @param checkInDateStr - The date string to parse
 * @returns The constructed Date object (may be invalid if unrecognized)
 */
export function parseCheckInDate(checkInDateStr: string): Date {
  let checkIn: Date;

  if (checkInDateStr.includes('/')) {
    // Format: MM/DD/YYYY
    const [m, d, y] = checkInDateStr.split('/').map(Number);
    checkIn = new Date(y, m - 1, d);
  } else if (checkInDateStr.includes('-')) {
    // Format: YYYY-MM-DD
    const [y, m, d] = checkInDateStr.split('-').map(Number);
    checkIn = new Date(y, m - 1, d);
  } else {
    // last fallback - let Date parse attempt
    checkIn = new Date(checkInDateStr);
  }

  if (isNaN(checkIn.getTime())) {
    logger.error('Invalid checkIn date encountered:', checkInDateStr);
  }
  return checkIn;
}

/**
 * parseDateString
 * Attempts to parse various date formats into a valid Date instance.
 * Acceptable formats:
 *  - MM/DD/YYYY
 *  - YYYY-MM-DD
 *  - any format parseable by new Date() fallback
 * Returns null if parsing fails.
 *
 * @param dateStr - The date string
 * @returns A Date object if parsing succeeds, else null
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  // First, try built-in parse
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  // If built-in fails, try slash format (MM/DD/YYYY)
  if (dateStr.includes('/')) {
    const [monthStr, dayStr, yearStr] = dateStr
      .split('/')
      .map((part) => part.trim());
    if (monthStr && dayStr && yearStr) {
      const month = parseInt(monthStr, 10) - 1;
      const day = parseInt(dayStr, 10);
      const year = parseInt(yearStr, 10);
      const manualDate = new Date(year, month, day);
      if (!isNaN(manualDate.getTime())) {
        return manualDate;
      }
    }
  }

  // Otherwise, parsing failed
  return null;
}

/**
 * formatToYYYYMMDD
 * Converts a Date object to 'YYYY-MM-DD' format in local time.
 *
 * @param dateObj - A valid Date instance
 * @returns A string in 'YYYY-MM-DD' format, or '' if invalid
 */
export function formatToYYYYMMDD(dateObj: Date): string {
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * computeOrderDate
 * Parses a check-in date string, adds (nightKey - 1) days,
 * and returns the final date in 'YYYY-MM-DD' format.
 *
 * @param checkInDateStr - The date string
 * @param nightKey - The night index (1-based)
 * @returns The computed date in 'YYYY-MM-DD' format, or '' if parse fails
 */
export function computeOrderDate(
  checkInDateStr: string,
  nightKey: number,
): string {
  const baseDate = parseDateString(checkInDateStr);
  if (!baseDate) {
    logger.warn('Could not parse checkInDateStr:', checkInDateStr);
    return '';
  }

  baseDate.setDate(baseDate.getDate() + (nightKey - 1));
  return formatToYYYYMMDD(baseDate);
}

/**
 * getDaysBetween
 * Computes the difference in days between two date/timestamp strings.
 * If either parse fails, returns NaN.
 *
 * @param dateStr1 - First date string
 * @param dateStr2 - Second date string
 * @returns The difference in days (could be negative) or NaN if parse fails
 */
export function getDaysBetween(dateStr1: string, dateStr2: string): number {
  const dateObj1 = parseDateString(dateStr1);
  const dateObj2 = parseDateString(dateStr2);

  if (!dateObj1 || !dateObj2) {
    logger.warn(
      'One or both date strings could not be parsed:',
      dateStr1,
      dateStr2,
    );
    return NaN;
  }

  const msDiff = dateObj2.getTime() - dateObj1.getTime();
  const dayInMs = 1000 * 60 * 60 * 24;
  return msDiff / dayInMs;
}

/**
 * getLocalTimestamp
 * Produces a local ISO string with .000+xx:yy offset.
 * Example: "2025-05-03T17:40:29.000+02:00"
 *
 * @returns A string representation with local offset
 */
export function getLocalTimestamp(): string {
  const date = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');

  const isoBase = date.toISOString().split('.')[0];
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes > 0 ? '-' : '+';
  const absOffset = Math.abs(offsetMinutes);
  const hours = pad(Math.floor(absOffset / 60));
  const minutes = pad(absOffset % 60);

  return `${isoBase}.000${sign}${hours}:${minutes}`;
}

/**
 * formatDateToDDMM
 * Formats a Date object to "DD-MM" (e.g., "09-03").
 *
 * @param date - A valid Date instance
 * @returns The date in "DD-MM" format, or '' if invalid
 */
export function formatDateToDDMM(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}`;
}

/**
 * getItalyIsoString
 * Returns an ISO8601 string for the local time in Italy (Europe/Rome),
 * e.g. "2025-05-03T17:43:14.000+02:00".
 *
 * @returns The Italy-local ISO8601 formatted string
 */
export function getItalyIsoString(): string {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(now);

  const dayStr = parts.find((p) => p.type === 'day')?.value ?? '01';
  const monthStr = parts.find((p) => p.type === 'month')?.value ?? '01';
  const yearStr = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const secondStr = parts.find((p) => p.type === 'second')?.value ?? '00';

  const localRomeDate = new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    Number(hourStr),
    Number(minuteStr),
    Number(secondStr),
  );

  const tzOffsetMinutes = -localRomeDate.getTimezoneOffset();
  const sign = tzOffsetMinutes >= 0 ? '+' : '-';
  const offsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
  const offsetMins = Math.abs(tzOffsetMinutes) % 60;
  const ms = String(localRomeDate.getMilliseconds()).padStart(3, '0');
  const yyyy = String(localRomeDate.getFullYear()).padStart(4, '0');
  const mm = String(localRomeDate.getMonth() + 1).padStart(2, '0');
  const dd = String(localRomeDate.getDate()).padStart(2, '0');
  const hh = String(localRomeDate.getHours()).padStart(2, '0');
  const min = String(localRomeDate.getMinutes()).padStart(2, '0');
  const sec = String(localRomeDate.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}.${ms}${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
}

/**
 * getItalyLocalDate
 * Retrieves the current local Date for Italy (Europe/Rome time zone).
 *
 * @returns A Date object representing the current time in Italy.
 */
export function getItalyLocalDate(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }),
  );
}

/**
 * formatDateToMMDD
 * Formats a Date object to "MMDD" (e.g., "0309" for March 9).
 *
 * @param date - A valid Date instance
 * @returns The date in "MMDD" format, or '' if invalid
 */
export function formatDateToMMDD(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}${dd}`;
}

/**
 * isBreakfastOrderAllowed
 * Returns true when a breakfast order can still be placed for the given service
 * date. Orders are allowed for future dates, or for the current Italy date
 * until 03:00 Europe/Rome.
 */
export function isBreakfastOrderAllowed(
  serviceDate: string,
  now: Date = getItalyLocalDate(),
): boolean {
  const service = parseDateString(serviceDate);
  if (!service) return false;

  const serviceOnly = new Date(
    service.getFullYear(),
    service.getMonth(),
    service.getDate(),
  );
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (serviceOnly.getTime() > todayOnly.getTime()) return true;
  if (serviceOnly.getTime() < todayOnly.getTime()) return false;

  return now.getHours() < 3;
}

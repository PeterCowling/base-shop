/* eslint-disable ds/no-hardcoded-copy -- PRIME-DATE-UTILS-001 [ttl=2026-12-31] Internal date parsing/formatting constants and log labels; non-UI strings by design. */
// src/utils/dateUtils.ts

import logger from '@acme/lib/logger/client';

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

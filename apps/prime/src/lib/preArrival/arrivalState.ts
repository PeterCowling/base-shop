/**
 * arrivalState.ts
 *
 * Pure functions for determining guest arrival state based on dates.
 * Uses Europe/Rome timezone for all date comparisons (Positano local time).
 *
 * This module is the single source of truth for arrival state logic.
 */

import { formatDate, parseDate } from '@acme/date-utils';

import type { GuestArrivalState } from '../../types/preArrival';

/**
 * Booking timezone (Positano, Italy).
 * All date comparisons use this timezone to prevent midnight edge cases.
 */
export const BOOKING_TIMEZONE = 'Europe/Rome';

/**
 * Get the current date in the booking timezone as YYYY-MM-DD.
 */
export function getTodayInBookingTimezone(): string {
  return formatDate(new Date(), 'yyyy-MM-dd', BOOKING_TIMEZONE);
}

/**
 * Compare two ISO date strings in the booking timezone.
 *
 * @param dateA - First date (YYYY-MM-DD)
 * @param dateB - Second date (YYYY-MM-DD)
 * @returns negative if dateA < dateB, 0 if equal, positive if dateA > dateB
 */
export function compareDatesInTimezone(dateA: string, dateB: string): number {
  // Parse dates in booking timezone to get comparable timestamps
  const a = parseDate(`${dateA}T12:00:00`, BOOKING_TIMEZONE);
  const b = parseDate(`${dateB}T12:00:00`, BOOKING_TIMEZONE);

  if (!a || !b) {
    // Fallback to string comparison if parsing fails
    return dateA.localeCompare(dateB);
  }

  return a.getTime() - b.getTime();
}

/**
 * Check if a date is today in the booking timezone.
 */
export function isDateToday(date: string): boolean {
  const today = getTodayInBookingTimezone();
  return compareDatesInTimezone(date, today) === 0;
}

/**
 * Check if a date is in the future (after today) in the booking timezone.
 */
export function isDateInFuture(date: string): boolean {
  const today = getTodayInBookingTimezone();
  return compareDatesInTimezone(date, today) > 0;
}

/**
 * Check if a date is in the past (before today) in the booking timezone.
 */
export function isDateInPast(date: string): boolean {
  const today = getTodayInBookingTimezone();
  return compareDatesInTimezone(date, today) < 0;
}

/**
 * Determine the guest's arrival state based on check-in/checkout dates
 * and their current check-in status.
 *
 * States:
 * - pre-arrival: Before check-in date
 * - arrival-day: On check-in date, not yet checked in
 * - checked-in: After check-in (or marked as checked in)
 * - checked-out: After checkout date
 *
 * @param checkInDate - ISO date string (YYYY-MM-DD)
 * @param checkOutDate - ISO date string (YYYY-MM-DD)
 * @param isCheckedIn - Whether the guest has been marked as checked in
 * @returns The guest's current arrival state
 */
export function getGuestArrivalState(
  checkInDate: string,
  checkOutDate: string,
  isCheckedIn: boolean,
): GuestArrivalState {
  // If already checked in via reception, they're in checked-in state
  if (isCheckedIn) {
    return 'checked-in';
  }

  // Check if past checkout date
  if (isDateInPast(checkOutDate)) {
    return 'checked-out';
  }

  // Check if arrival day (today = check-in date)
  if (isDateToday(checkInDate)) {
    return 'arrival-day';
  }

  // Check if before check-in date
  if (isDateInFuture(checkInDate)) {
    return 'pre-arrival';
  }

  // Past check-in date but not marked as checked in
  // This could happen if check-in wasn't recorded - assume they're staying
  return 'checked-in';
}

/**
 * Check if a guest should see the pre-arrival dashboard.
 * This includes both pre-arrival and arrival-day states.
 */
export function shouldShowPreArrivalDashboard(
  checkInDate: string,
  checkOutDate: string,
  isCheckedIn: boolean,
): boolean {
  const state = getGuestArrivalState(checkInDate, checkOutDate, isCheckedIn);
  return state === 'pre-arrival' || state === 'arrival-day';
}

/**
 * Get a human-readable label for the arrival state.
 * Useful for debugging and analytics.
 */
export function getArrivalStateLabel(state: GuestArrivalState): string {
  switch (state) {
    case 'pre-arrival':
      return 'Pre-arrival';
    case 'arrival-day':
      return 'Arrival day';
    case 'checked-in':
      return 'Checked in';
    case 'checked-out':
      return 'Checked out';
    default:
      return 'Unknown';
  }
}

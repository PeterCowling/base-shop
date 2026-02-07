/**
 * useDateInfo
 *
 * Computes date-related information for a booking:
 * - Days until check-in (if not yet checked in)
 * - Days remaining (if currently checked in)
 * - Check-in status
 * - Formatted dates
 * - Order dates for each night
 */

import logger from '@/utils/logger';
import { useMemo } from 'react';
import {
  computeOrderDate,
  formatDateToDDMM,
  formatToYYYYMMDD,
  getDaysBetween,
  getLocalTimestamp,
  parseCheckInDate,
  parseDateString,
} from '../../utils/dateUtils';

export interface DateInfo {
  daysUntilCheckIn: number | null;
  daysRemaining: number | null;
}

export interface UseDateInfoInput {
  checkInDate?: string;
  nights?: number;
}

export interface UseDateInfoResult {
  dateInfo: DateInfo;
  isCheckedIn: boolean;
  localTimestamp: string;
  checkInDateDDMM: string;
  computedOrderDates: string[];
}

export function useDateInfo(input: UseDateInfoInput): UseDateInfoResult {
  const { checkInDate, nights } = input;

  // Calculate days until check-in or days remaining
  const dateInfo = useMemo<DateInfo>(() => {
    if (!checkInDate || !nights) {
      return { daysUntilCheckIn: null, daysRemaining: null };
    }

    try {
      const checkinDate = parseCheckInDate(checkInDate);
      if (Number.isNaN(checkinDate.getTime())) {
        throw new Error(`Invalid checkInDate: ${checkInDate}`);
      }

      const checkoutDate = new Date(checkinDate);
      checkoutDate.setDate(checkinDate.getDate() + nights);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkinDate.setHours(0, 0, 0, 0);
      checkoutDate.setHours(0, 0, 0, 0);

      const todayStr = formatToYYYYMMDD(today);
      const checkinStr = formatToYYYYMMDD(checkinDate);
      const checkoutStr = formatToYYYYMMDD(checkoutDate);

      const daysSinceCheckIn = getDaysBetween(checkinStr, todayStr);

      if (daysSinceCheckIn >= 0) {
        // Guest is checked in
        const daysUntilCheckOut = getDaysBetween(todayStr, checkoutStr);
        return {
          daysUntilCheckIn: null,
          daysRemaining: daysUntilCheckOut >= 0 ? daysUntilCheckOut : 0,
        };
      } else {
        // Guest not yet checked in
        const daysUntilCheckInVal = getDaysBetween(todayStr, checkinStr);
        return { daysUntilCheckIn: daysUntilCheckInVal, daysRemaining: null };
      }
    } catch (err) {
      logger.error('[useDateInfo] Error parsing date info:', err);
      return { daysUntilCheckIn: null, daysRemaining: null };
    }
  }, [checkInDate, nights]);

  // Is the guest currently checked in?
  const isCheckedIn = useMemo(() => {
    return dateInfo.daysRemaining !== null && dateInfo.daysRemaining > 0;
  }, [dateInfo]);

  // Current local timestamp
  const localTimestamp = useMemo(() => getLocalTimestamp(), []);

  // Check-in date formatted as DD/MM
  const checkInDateDDMM = useMemo(() => {
    if (!checkInDate) return '';
    const dateObj = parseDateString(checkInDate);
    return dateObj ? formatDateToDDMM(dateObj) : '';
  }, [checkInDate]);

  // Compute order dates for each night
  const computedOrderDates = useMemo(() => {
    if (!checkInDate || !nights) return [];
    const results: string[] = [];
    for (let nightKey = 1; nightKey <= nights; nightKey += 1) {
      const orderDate = computeOrderDate(checkInDate, nightKey);
      if (orderDate) results.push(orderDate);
    }
    return results;
  }, [checkInDate, nights]);

  return {
    dateInfo,
    isCheckedIn,
    localTimestamp,
    checkInDateDDMM,
    computedOrderDates,
  };
}

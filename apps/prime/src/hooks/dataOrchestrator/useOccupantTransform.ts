/**
 * useOccupantTransform
 *
 * Transforms raw data sources into a unified OccupantData structure.
 * This hook is responsible ONLY for data transformation - no fetching.
 */

import logger from '@/utils/logger';
import { useMemo } from 'react';
import type { BagStorageRecord } from '../../types/bagStorage';
import type { BookingDetails } from '../pureData/useFetchBookingsData';
import type { CityTaxOccupantRecord, CityTaxRecord } from '../../types/cityTax';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import type {
  FinancialsRoomRecord,
  FinancialsTransaction,
} from '../../types/financialsRoom';
import type { GuestByRoomRecord } from '../../types/guestByRoom';
import type { GuestDetailsRecord } from '../../types/guestsDetails';
import type { LoanOccupantRecord } from '../../types/loans';
import type { PreorderNightData } from '../../types/preorder';
import {
  formatToYYYYMMDD,
  getDaysBetween,
  parseCheckInDate,
} from '../../utils/dateUtils';
import type { OccupantPreordersData, PreordersDataRecord } from './useOccupantDataSources';

export interface ProcessedPreorder extends PreorderNightData {
  id: string;
  night: string;
}

export interface OccupantDataTransformed {
  reservationCode?: string;
  checkInDate?: string;
  checkOutDate?: string;
  leadGuest?: boolean;
  roomNumbers?: string[];

  loans: LoanOccupantRecord | null;
  firstName: string;
  lastName: string;
  citizenship?: string;
  dateOfBirth?: GuestDetailsRecord['dateOfBirth'];
  document?: GuestDetailsRecord['document'];
  email?: string;
  gender?: string;
  language?: string;
  municipality?: string;
  placeOfBirth?: string;

  allocatedRoom?: string;
  bookedRoom?: string;

  financials: FinancialsRoomRecord | null;
  preorders: ProcessedPreorder[];
  completedTasks?: OccupantCompletedTasks;

  cityTax: CityTaxOccupantRecord | null;
  bagStorage: BagStorageRecord | null;

  paymentTerms?: boolean;
  nights?: number;
}

export interface UseOccupantTransformInput {
  bookingsData: BookingDetails | null;
  loansData: LoanOccupantRecord | null;
  guestDetailsData: GuestDetailsRecord | null;
  guestRoomData: Record<string, GuestByRoomRecord> | null;
  financialsData: FinancialsRoomRecord | null;
  preordersData: PreorderNightData[] | PreordersDataRecord | null;
  occupantTasks: OccupantCompletedTasks | undefined;
  cityTaxData: CityTaxRecord | null;
  bagStorageData: BagStorageRecord | null;
}

export interface UseOccupantTransformResult {
  occupantData: OccupantDataTransformed | null;
  occupantRoomIdKey: string | null;
}

/**
 * Compute the number of nights between check-in and check-out dates
 */
function computeNights(checkInDate?: string, checkOutDate?: string): number | undefined {
  if (!checkInDate || !checkOutDate) return undefined;
  try {
    const inDate = parseCheckInDate(checkInDate);
    const outDate = parseCheckInDate(checkOutDate);
    return getDaysBetween(formatToYYYYMMDD(inDate), formatToYYYYMMDD(outDate));
  } catch {
    return undefined;
  }
}

/**
 * Derive payment terms from financials transactions
 */
function derivePaymentTerms(
  reservationCode: string | undefined,
  financials: FinancialsRoomRecord | null
): boolean | undefined {
  if (!reservationCode || !financials?.transactions) return undefined;
  const txArray = Object.values<FinancialsTransaction>(financials.transactions);
  return txArray.some((tx) => tx.nonRefundable === true);
}

/**
 * Process preorders from either array or object format
 */
function processPreorders(
  preordersData: PreorderNightData[] | PreordersDataRecord | null,
  occupantRoomIdKey: string | null
): ProcessedPreorder[] {
  if (!preordersData) return [];

  // Array format
  if (Array.isArray(preordersData)) {
    return preordersData
      .map((item, index) => {
        let nightKey = item.night;
        let derivedId: string | undefined;

        if (typeof item.id === 'string') {
          derivedId = item.id;
        } else if (typeof item.id === 'number') {
          derivedId = String(item.id);
        }

        // Extract night number from id if nightKey is missing
        if (!nightKey && derivedId) {
          const match = derivedId.match(/^night(\d+)$/i);
          if (match) {
            nightKey = `Night${match[1]}`;
          }
        }

        // Normalize nightKey format
        if (nightKey && !/^Night\d+$/i.test(nightKey)) {
          const match = nightKey.match(/^night(\d+)$/i);
          if (match) {
            nightKey = `Night${match[1]}`;
          } else {
            logger.warn('Non-standard night key:', nightKey, item);
          }
        }

        if (!nightKey) return null;

        const fallbackNight = `night${index}`;
        derivedId = `${occupantRoomIdKey || 'unknown'}_${nightKey || fallbackNight}_${index}`;

        return {
          id: derivedId,
          night: nightKey,
          breakfast: item.breakfast,
          drink1: item.drink1,
          drink2: item.drink2,
        };
      })
      .filter((item): item is ProcessedPreorder => item !== null);
  }

  // Object format
  if (occupantRoomIdKey && typeof preordersData === 'object') {
    const typedData = preordersData as PreordersDataRecord;
    if (Object.prototype.hasOwnProperty.call(typedData, occupantRoomIdKey)) {
      const occupantSpecificPreorders = typedData[occupantRoomIdKey];
      if (occupantSpecificPreorders) {
        return Object.entries(occupantSpecificPreorders).map(
          ([rawNightKey, val], index) => ({
            id: `${occupantRoomIdKey}_${rawNightKey}_${index}`,
            night: /^Night\d+$/i.test(rawNightKey)
              ? rawNightKey
              : `Night${rawNightKey.replace(/\D/g, '')}`,
            breakfast: val.breakfast,
            drink1: val.drink1,
            drink2: val.drink2,
          })
        );
      }
    }
  }

  return [];
}

export function useOccupantTransform(
  input: UseOccupantTransformInput
): UseOccupantTransformResult {
  const {
    bookingsData,
    loansData,
    guestDetailsData,
    guestRoomData,
    financialsData,
    preordersData,
    occupantTasks,
    cityTaxData,
    bagStorageData,
  } = input;

  // Get the first occupant room key
  const occupantRoomIdKey = useMemo<string | null>(() => {
    if (!guestRoomData) return null;
    const keys = Object.keys(guestRoomData);
    return keys.length > 0 ? keys[0] : null;
  }, [guestRoomData]);

  // Transform all data into unified structure
  const occupantData = useMemo<OccupantDataTransformed | null>(() => {
    if (!bookingsData && !guestDetailsData) return null;

    const {
      reservationCode,
      checkInDate,
      checkOutDate,
      leadGuest,
      roomNumbers,
    } = bookingsData || {};

    const {
      firstName = '',
      lastName = '',
      citizenship,
      dateOfBirth,
      document,
      email,
      gender,
      language,
      municipality,
      placeOfBirth,
    } = guestDetailsData || {};

    const occupantRoom = occupantRoomIdKey && guestRoomData
      ? guestRoomData[occupantRoomIdKey]
      : undefined;

    // Get city tax for this occupant
    let occupantCityTax: CityTaxOccupantRecord | null = null;
    if (occupantRoomIdKey && cityTaxData) {
      const taxDataForKey = cityTaxData[occupantRoomIdKey];
      if (taxDataForKey) {
        occupantCityTax = taxDataForKey;
      }
    }

    return {
      reservationCode,
      checkInDate,
      checkOutDate,
      leadGuest,
      roomNumbers,
      nights: computeNights(checkInDate, checkOutDate),
      loans: loansData,
      firstName,
      lastName,
      citizenship,
      dateOfBirth,
      document,
      email,
      gender,
      language,
      municipality,
      placeOfBirth,
      allocatedRoom: occupantRoom?.allocated,
      bookedRoom: occupantRoom?.booked,
      financials: financialsData,
      preorders: processPreorders(preordersData, occupantRoomIdKey),
      completedTasks: occupantTasks,
      paymentTerms: derivePaymentTerms(reservationCode, financialsData),
      cityTax: occupantCityTax,
      bagStorage: bagStorageData ?? { optedIn: false },
    };
  }, [
    bookingsData,
    guestDetailsData,
    loansData,
    guestRoomData,
    financialsData,
    preordersData,
    occupantTasks,
    cityTaxData,
    bagStorageData,
    occupantRoomIdKey,
  ]);

  return { occupantData, occupantRoomIdKey };
}

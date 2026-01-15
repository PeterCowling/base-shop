/**
 * Email template data helpers.
 *
 * Provides data for email templates based on guest UUID.
 * Used by Cloud Functions to generate personalized emails.
 */

import { get, ref } from 'firebase/database';
import { db } from '@/services/firebase';
import { computeReadinessScore } from '../preArrival';
import type { PreArrivalData } from '../../types/preArrival';
import { DEFAULT_PRE_ARRIVAL } from '../../types/preArrival';

/**
 * Default values for calculations.
 */
const DEFAULTS = {
  CITY_TAX_PER_NIGHT: 3, // EUR
  KEYCARD_DEPOSIT: 10, // EUR
  CHECK_IN_WINDOW: '15:00-22:00',
};

/**
 * Pre-arrival email data structure.
 */
export interface PreArrivalEmailData {
  /** Guest's first name */
  firstName: string;
  /** Guest's email */
  email: string;
  /** Preferred language */
  language: string;
  /** Booking/reservation code */
  bookingCode: string;
  /** Check-in date (ISO format) */
  checkInDate: string;
  /** Check-out date (ISO format) */
  checkOutDate: string;
  /** Number of nights */
  nights: number;
  /** Current readiness score (0-100) */
  readinessScore: number;
  /** City tax amount due */
  cityTaxDue: number;
  /** Deposit amount due */
  depositDue: number;
  /** Total cash to bring */
  totalCashDue: number;
  /** Whether route has been planned */
  routePlanned: boolean;
  /** Whether ETA has been confirmed */
  etaConfirmed: boolean;
  /** Whether cash is prepared */
  cashPrepared: boolean;
  /** Personal portal URL */
  portalUrl: string;
}

/**
 * Arrival day email data structure.
 */
export interface ArrivalDayEmailData {
  /** Guest's first name */
  firstName: string;
  /** Guest's email */
  email: string;
  /** Preferred language */
  language: string;
  /** Booking/reservation code */
  bookingCode: string;
  /** Check-in code for QR generation (client-side) */
  checkInCode: string;
  /** Check-in time window */
  checkInWindow: string;
  /** Expected arrival time if confirmed */
  etaWindow: string | null;
  /** How guest is arriving */
  etaMethod: string | null;
  /** Total cash to bring */
  totalCashDue: number;
  /** City tax amount */
  cityTaxDue: number;
  /** Deposit amount */
  depositDue: number;
  /** Personal portal URL (for QR code generation) */
  portalUrl: string;
}

/**
 * Fetch booking data for a guest.
 */
async function fetchBookingData(uuid: string): Promise<{
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
} | null> {
  try {
    const bookingsRef = ref(db, 'bookings');
    const snapshot = await get(bookingsRef);

    if (!snapshot.exists()) return null;

    const bookings = snapshot.val() as Record<string, Record<string, unknown>>;

    for (const [bookingCode, bookingData] of Object.entries(bookings)) {
      const occupants = bookingData.occupants as Record<string, boolean> | undefined;
      if (occupants && occupants[uuid]) {
        // Found the booking - get occupant data
        const occupantPath = `bookings/${bookingCode}/${uuid}`;
        const occupantSnapshot = await get(ref(db, occupantPath));

        if (occupantSnapshot.exists()) {
          const occupant = occupantSnapshot.val() as {
            checkInDate?: string;
            checkOutDate?: string;
            nights?: number;
          };

          return {
            bookingCode,
            checkInDate: occupant.checkInDate ?? '',
            checkOutDate: occupant.checkOutDate ?? '',
            nights: occupant.nights ?? 1,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[emailData] Error fetching booking data:', error);
    return null;
  }
}

/**
 * Fetch guest details.
 */
async function fetchGuestDetails(
  uuid: string,
  bookingCode: string,
): Promise<{
  firstName: string;
  lastName: string;
  email: string;
  language: string;
} | null> {
  try {
    const guestDetailsRef = ref(db, `guestsDetails/${bookingCode}/${uuid}`);
    const snapshot = await get(guestDetailsRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.val() as {
      firstName?: string;
      lastName?: string;
      email?: string;
      language?: string;
    };

    return {
      firstName: data.firstName ?? 'Guest',
      lastName: data.lastName ?? '',
      email: data.email ?? '',
      language: data.language ?? 'en',
    };
  } catch (error) {
    console.error('[emailData] Error fetching guest details:', error);
    return null;
  }
}

/**
 * Fetch pre-arrival data.
 */
async function fetchPreArrivalData(uuid: string): Promise<PreArrivalData> {
  try {
    const preArrivalRef = ref(db, `preArrival/${uuid}`);
    const snapshot = await get(preArrivalRef);

    if (!snapshot.exists()) return DEFAULT_PRE_ARRIVAL;

    return snapshot.val() as PreArrivalData;
  } catch (error) {
    console.error('[emailData] Error fetching pre-arrival data:', error);
    return DEFAULT_PRE_ARRIVAL;
  }
}

/**
 * Fetch city tax data if available.
 */
async function fetchCityTaxDue(
  uuid: string,
  bookingCode: string,
  nights: number,
): Promise<number> {
  try {
    const cityTaxRef = ref(db, `cityTax/${bookingCode}/${uuid}`);
    const snapshot = await get(cityTaxRef);

    if (snapshot.exists()) {
      const data = snapshot.val() as { totalDue?: number };
      if (typeof data.totalDue === 'number') {
        return data.totalDue;
      }
    }

    // Fall back to calculation
    return nights * DEFAULTS.CITY_TAX_PER_NIGHT;
  } catch {
    return nights * DEFAULTS.CITY_TAX_PER_NIGHT;
  }
}

/**
 * Fetch check-in code for a guest.
 */
async function fetchCheckInCode(uuid: string): Promise<string | null> {
  try {
    const codeRef = ref(db, `checkInCodes/byUuid/${uuid}`);
    const snapshot = await get(codeRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.val() as { code?: string; expiresAt?: number };

    // Check if expired
    if (data.expiresAt && data.expiresAt < Date.now()) {
      return null;
    }

    return data.code ?? null;
  } catch {
    return null;
  }
}

/**
 * Build portal URL for a guest.
 */
function buildPortalUrl(uuid: string, baseUrl: string): string {
  return `${baseUrl}/?uuid=${uuid}`;
}

/**
 * Get pre-arrival email data for a guest.
 *
 * Used for week-before and 48-hour reminder emails.
 */
export async function getPreArrivalEmailData(
  uuid: string,
  baseUrl: string,
): Promise<PreArrivalEmailData | null> {
  const booking = await fetchBookingData(uuid);
  if (!booking) {
    console.error('[emailData] No booking found for uuid:', uuid);
    return null;
  }

  const guestDetails = await fetchGuestDetails(uuid, booking.bookingCode);
  if (!guestDetails) {
    console.error('[emailData] No guest details found for uuid:', uuid);
    return null;
  }

  const preArrival = await fetchPreArrivalData(uuid);
  const cityTaxDue = await fetchCityTaxDue(uuid, booking.bookingCode, booking.nights);
  const depositDue = DEFAULTS.KEYCARD_DEPOSIT;
  const readinessScore = computeReadinessScore(preArrival.checklistProgress);

  return {
    firstName: guestDetails.firstName,
    email: guestDetails.email,
    language: guestDetails.language,
    bookingCode: booking.bookingCode,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    nights: booking.nights,
    readinessScore,
    cityTaxDue,
    depositDue,
    totalCashDue: cityTaxDue + depositDue,
    routePlanned: preArrival.checklistProgress.routePlanned,
    etaConfirmed: preArrival.checklistProgress.etaConfirmed,
    cashPrepared: preArrival.checklistProgress.cashPrepared,
    portalUrl: buildPortalUrl(uuid, baseUrl),
  };
}

/**
 * Get arrival day email data for a guest.
 *
 * Used for check-in day morning email with QR code.
 * Note: QR code is generated client-side, not embedded in email.
 */
export async function getArrivalDayEmailData(
  uuid: string,
  baseUrl: string,
): Promise<ArrivalDayEmailData | null> {
  const booking = await fetchBookingData(uuid);
  if (!booking) {
    console.error('[emailData] No booking found for uuid:', uuid);
    return null;
  }

  const guestDetails = await fetchGuestDetails(uuid, booking.bookingCode);
  if (!guestDetails) {
    console.error('[emailData] No guest details found for uuid:', uuid);
    return null;
  }

  const preArrival = await fetchPreArrivalData(uuid);
  const checkInCode = await fetchCheckInCode(uuid);
  const cityTaxDue = await fetchCityTaxDue(uuid, booking.bookingCode, booking.nights);
  const depositDue = DEFAULTS.KEYCARD_DEPOSIT;

  if (!checkInCode) {
    console.error('[emailData] No check-in code found for uuid:', uuid);
    return null;
  }

  return {
    firstName: guestDetails.firstName,
    email: guestDetails.email,
    language: guestDetails.language,
    bookingCode: booking.bookingCode,
    checkInCode,
    checkInWindow: DEFAULTS.CHECK_IN_WINDOW,
    etaWindow: preArrival.etaWindow,
    etaMethod: preArrival.etaMethod,
    totalCashDue: cityTaxDue + depositDue,
    cityTaxDue,
    depositDue,
    portalUrl: buildPortalUrl(uuid, baseUrl),
  };
}

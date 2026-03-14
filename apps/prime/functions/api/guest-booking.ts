/**
 * CF Pages Function: /api/guest-booking
 *
 * Returns booking snapshot for an authenticated guest session token.
 * This endpoint is the server-mediated source for booking details/status.
 */

import {
  bagStorageOccupantPath,
  bookingRootPath,
  checkinOccupantPath,
  guestByRoomOccupantPath,
  guestDetailsOccupantPath,
  preorderOccupantPath,
  primeRequestByGuestPath,
  primeRequestByIdPath,
} from '@acme/lib/hospitality';

import type { PrimeRequestRecord, PrimeRequestSummaryByGuest } from '../../src/types/primeRequests';
import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { validateGuestSessionToken } from '../lib/guest-session';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface BookingOccupantRecord {
  checkInDate?: string;
  checkOutDate?: string;
  roomNumbers?: string[];
  room?: string;
  firstName?: string;
  lastName?: string;
}

interface GuestDetailsRecord {
  firstName?: string;
  lastName?: string;
}

interface GuestByRoomRecord {
  allocated?: string;
}

interface BagStorageRecord {
  optedIn?: boolean;
  requestStatus?: string;
  pickupWindow?: string | null;
  note?: string;
  requestId?: string | null;
}

function getTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

function resolveArrivalState(
  checkInDate: string,
  checkOutDate: string,
  isCheckedIn: boolean,
): 'pre-arrival' | 'arrival-day' | 'checked-in' | 'checked-out' {
  if (isCheckedIn) {
    return 'checked-in';
  }

  const today = getTodayIso();
  if (compareIsoDates(checkOutDate, today) < 0) {
    return 'checked-out';
  }
  if (compareIsoDates(checkInDate, today) === 0) {
    return 'arrival-day';
  }
  if (compareIsoDates(checkInDate, today) > 0) {
    return 'pre-arrival';
  }

  return 'checked-in';
}

async function getGuestRequestSummary(
  firebase: FirebaseRest,
  guestUuid: string,
): Promise<PrimeRequestSummaryByGuest> {
  const summary: PrimeRequestSummaryByGuest = {
    extension: null,
    bag_drop: null,
    meal_change_exception: null,
  };

  const byGuest = await firebase.get<Record<string, boolean>>(primeRequestByGuestPath(guestUuid));
  if (!byGuest) {
    return summary;
  }

  const requestIds = Object.keys(byGuest);
  const records = await Promise.all(
    requestIds.map((requestId) => firebase.get<PrimeRequestRecord>(primeRequestByIdPath(requestId))),
  );

  for (const record of records) {
    if (!record) {
      continue;
    }
    if (record.type === 'extension') {
      summary.extension = record;
    } else if (record.type === 'bag_drop') {
      summary.bag_drop = record;
    } else if (record.type === 'meal_change_exception') {
      summary.meal_change_exception = record;
    }
  }

  return summary;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  try {
    const authResult = await validateGuestSessionToken(token, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const firebase = new FirebaseRest(env);
    const booking = await firebase.get<Record<string, BookingOccupantRecord>>(
      bookingRootPath(authResult.session.bookingId),
    );

    if (!booking) {
      return errorResponse('Booking not found', 404);
    }

    const occupantKeys = Object.keys(booking).filter((key) => key.startsWith('occ_'));

    let guestUuid: string | null;
    if (authResult.session.guestUuid) {
      if (!booking[authResult.session.guestUuid]) {
        // Session carries a guestUuid but it is not present in this booking.
        // Do not silently fall back to another occupant — return a clear error.
        console.warn(
          `[guest-booking] guestUuid mismatch: session uuid not found in booking ${authResult.session.bookingId}`,
        );
        return errorResponse('Guest not found in booking', 404);
      }
      guestUuid = authResult.session.guestUuid;
    } else {
      // No guestUuid in session (legacy/anonymous): use first occupant as fallback.
      guestUuid = occupantKeys[0] ?? null;
    }

    if (!guestUuid) {
      return errorResponse('Booking occupant not found', 404);
    }

    const occupant = booking[guestUuid] ?? null;
    if (!occupant?.checkInDate || !occupant.checkOutDate) {
      return errorResponse('Booking dates missing', 422);
    }

    const [guestDetails, guestByRoom, bagStorage, preorders, checkins, requestSummary] = await Promise.all([
      firebase.get<GuestDetailsRecord>(guestDetailsOccupantPath(authResult.session.bookingId, guestUuid)),
      firebase.get<GuestByRoomRecord>(guestByRoomOccupantPath(guestUuid)),
      firebase.get<BagStorageRecord>(bagStorageOccupantPath(guestUuid)),
      firebase.get<Record<string, unknown>>(preorderOccupantPath(guestUuid)),
      firebase.get<Record<string, unknown>>(checkinOccupantPath(occupant.checkInDate, guestUuid)),
      getGuestRequestSummary(firebase, guestUuid),
    ]);

    const firstName = guestDetails?.firstName ?? occupant.firstName ?? '';
    const lastName = guestDetails?.lastName ?? occupant.lastName ?? '';
    const guestName = `${firstName} ${lastName}`.trim() || 'Guest';
    const isCheckedIn = Boolean(checkins);
    const arrivalState = resolveArrivalState(
      occupant.checkInDate,
      occupant.checkOutDate,
      isCheckedIn,
    );

    return jsonResponse({
      bookingId: authResult.session.bookingId,
      guestUuid,
      guestName,
      reservationCode: authResult.session.bookingId,
      checkInDate: occupant.checkInDate,
      checkOutDate: occupant.checkOutDate,
      roomNumbers: occupant.roomNumbers ?? [],
      roomAssignment: guestByRoom?.allocated ?? occupant.room ?? occupant.roomNumbers?.[0] ?? 'Not assigned',
      isCheckedIn,
      arrivalState,
      preorders: preorders ?? {},
      bagStorage: bagStorage ?? null,
      requestSummary,
    });
  } catch (error) {
    console.error('Error fetching guest booking snapshot:', error);
    return errorResponse('Failed to fetch guest booking snapshot', 500);
  }
};

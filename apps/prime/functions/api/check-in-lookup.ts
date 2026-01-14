/**
 * CF Pages Function: /api/check-in-lookup
 *
 * Staff can look up guest details by check-in code.
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface CodeLookup {
  bookingId: string;
  expiresAt: string;
}

interface Booking {
  guestName: string;
  roomAssignment: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  cityTaxDue: number;
  depositDue: number;
  etaWindow: string | null;
  etaMethod: string | null;
  [key: string]: unknown;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return errorResponse('code parameter is required', 400);
  }

  try {
    const firebase = new FirebaseRest(env);

    // Look up bookingId by code
    const codeLookup = await firebase.get<CodeLookup>(`checkInCodesByCode/${code.toUpperCase()}`);

    if (!codeLookup) {
      return errorResponse('Check-in code not found', 404);
    }

    // Check if expired
    if (new Date(codeLookup.expiresAt) < new Date()) {
      return errorResponse('Check-in code has expired', 410);
    }

    // Get booking details
    const booking = await firebase.get<Booking>(`bookings/${codeLookup.bookingId}`);

    if (!booking) {
      return errorResponse('Booking not found', 404);
    }

    // Return staff-friendly view
    return jsonResponse({
      guestName: booking.guestName || 'Unknown',
      roomAssignment: booking.roomAssignment || 'TBD',
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights || 1,
      cityTaxDue: booking.cityTaxDue || 0,
      depositDue: booking.depositDue || 0,
      etaWindow: booking.etaWindow || null,
      etaMethod: booking.etaMethod || null,
    });
  } catch (error) {
    console.error('Error looking up check-in code:', error);
    return errorResponse('Failed to look up check-in code', 500);
  }
};

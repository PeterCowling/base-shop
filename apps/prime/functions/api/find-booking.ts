/**
 * CF Pages Function: /api/find-booking
 *
 * Guests can find their booking by surname and booking reference.
 * Includes basic rate limiting via KV.
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../lib/firebase-rest';
import { generateToken, computeTokenExpiry, type GuestSessionToken } from '../lib/guest-token';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface BookingOccupant {
  checkInDate: string;
  checkOutDate: string;
  leadGuest?: boolean;
  roomNumbers?: string[];
}

interface GuestDetails {
  firstName?: string;
  lastName?: string;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function incrementRateLimit(env: Env, rateLimitKey: string): Promise<void> {
  if (!env.RATE_LIMIT) return;
  const currentAttempts = await env.RATE_LIMIT.get(rateLimitKey);
  const newAttempts = (parseInt(currentAttempts || '0', 10) + 1).toString();
  await env.RATE_LIMIT.put(rateLimitKey, newAttempts, {
    expirationTtl: WINDOW_MS / 1000,
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const surname = url.searchParams.get('surname');
  const bookingRef = url.searchParams.get('bookingRef');

  if (!surname || !bookingRef) {
    return errorResponse('surname and bookingRef parameters are required', 400);
  }

  // Simple rate limiting by IP
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `find-booking:${clientIP}`;

  if (env.RATE_LIMIT) {
    const attempts = await env.RATE_LIMIT.get(rateLimitKey);
    if (attempts && parseInt(attempts, 10) >= MAX_ATTEMPTS) {
      return errorResponse('Too many attempts. Please try again later.', 429);
    }
  }

  try {
    const firebase = new FirebaseRest(env);
    const normalizedRef = bookingRef.toUpperCase().trim();

    // Direct path lookup — the booking reference IS the Firebase key
    const booking = await firebase.get<Record<string, BookingOccupant>>(
      `bookings/${normalizedRef}`,
    );

    if (!booking) {
      await incrementRateLimit(env, rateLimitKey);
      return errorResponse('Booking not found', 404);
    }

    // Fetch all guest details for this booking
    const guestDetailsAll = await firebase.get<Record<string, GuestDetails>>(
      `guestsDetails/${normalizedRef}`,
    );

    if (!guestDetailsAll) {
      await incrementRateLimit(env, rateLimitKey);
      return errorResponse('Booking not found', 404);
    }

    // Find occupants and match surname
    const occupantKeys = Object.keys(booking).filter((key) => key.startsWith('occ_'));
    const normalizedSurname = surname.toLowerCase().trim();

    // Find any occupant whose lastName matches the input surname
    let matchedOccupantId: string | null = null;
    for (const occId of occupantKeys) {
      const details = guestDetailsAll[occId];
      if (details?.lastName && details.lastName.toLowerCase().trim() === normalizedSurname) {
        matchedOccupantId = occId;
        break;
      }
    }

    if (!matchedOccupantId) {
      await incrementRateLimit(env, rateLimitKey);
      return errorResponse('Booking not found', 404);
    }

    // Resolve lead guest for token issuance
    const leadOccupantId =
      occupantKeys.find((id) => booking[id]?.leadGuest) || occupantKeys[0] || matchedOccupantId;
    const leadOccupant = booking[leadOccupantId];

    // Issue a new guest session token
    const now = new Date();
    const token = generateToken();
    const tokenData: GuestSessionToken = {
      bookingId: normalizedRef,
      guestUuid: leadOccupantId,
      createdAt: now.toISOString(),
      expiresAt: computeTokenExpiry(leadOccupant?.checkOutDate || '', now),
    };

    await firebase.set(`guestSessionsByToken/${token}`, tokenData);

    // Reset rate limit on success
    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.delete(rateLimitKey);
    }

    return jsonResponse({ redirectUrl: `/g/${token}` });
  } catch (error) {
    console.error('Error finding booking:', error);
    return errorResponse('Failed to find booking', 500);
  }
};

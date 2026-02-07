/**
 * CF Pages Function: /api/find-booking
 *
 * Guests can find their booking by surname and booking reference.
 * Includes basic rate limiting via KV.
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface Booking {
  id: string;
  guestName: string;
  bookingRef: string;
  checkInCode?: string;
  guestPortalToken?: string;
  checkOutDate?: string;
  checkOut?: string;
  occupants?: string[];
  [key: string]: unknown;
}

interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const TOKEN_TTL_DAYS = 30;

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function computeTokenExpiry(booking: Booking, now: Date): string {
  const checkout = booking.checkOutDate || booking.checkOut;
  if (checkout) {
    const checkoutDate = new Date(checkout);
    if (!Number.isNaN(checkoutDate.getTime())) {
      const expiresAt = new Date(checkoutDate.getTime() + 48 * 60 * 60 * 1000);
      return expiresAt.toISOString();
    }
  }

  const fallback = new Date(now.getTime());
  fallback.setDate(fallback.getDate() + TOKEN_TTL_DAYS);
  return fallback.toISOString();
}

function isTokenValid(token: GuestSessionToken | null): boolean {
  if (!token) return false;
  return new Date(token.expiresAt) > new Date();
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

    // Search bookings by reference
    const allBookings = await firebase.get<Record<string, Booking>>('bookings');

    if (!allBookings) {
      // Increment rate limit on failure
      if (env.RATE_LIMIT) {
        const currentAttempts = await env.RATE_LIMIT.get(rateLimitKey);
        const newAttempts = (parseInt(currentAttempts || '0', 10) + 1).toString();
        await env.RATE_LIMIT.put(rateLimitKey, newAttempts, {
          expirationTtl: WINDOW_MS / 1000,
        });
      }
      return errorResponse('Booking not found', 404);
    }

    // Find matching booking (case-insensitive surname match)
    const normalizedSurname = surname.toLowerCase().trim();
    const normalizedRef = bookingRef.toUpperCase().trim();

    const matchingBooking = Object.entries(allBookings).find(([_, booking]) => {
      const bookingLastName = (booking.guestName || '').split(' ').pop()?.toLowerCase() || '';
      const bookingRefNormalized = (booking.bookingRef || '').toUpperCase();
      return bookingLastName === normalizedSurname && bookingRefNormalized === normalizedRef;
    });

    if (!matchingBooking) {
      // Increment rate limit on failure
      if (env.RATE_LIMIT) {
        const currentAttempts = await env.RATE_LIMIT.get(rateLimitKey);
        const newAttempts = (parseInt(currentAttempts || '0', 10) + 1).toString();
        await env.RATE_LIMIT.put(rateLimitKey, newAttempts, {
          expirationTtl: WINDOW_MS / 1000,
        });
      }
      return errorResponse('Booking not found', 404);
    }

    const [bookingId, booking] = matchingBooking;
    const now = new Date();

    // Guest portal token issuance (reuse if still valid)
    let guestPortalToken = booking.guestPortalToken || null;
    if (guestPortalToken) {
      const existingToken = await firebase.get<GuestSessionToken>(
        `guestSessionsByToken/${guestPortalToken}`
      );
      if (!isTokenValid(existingToken)) {
        guestPortalToken = null;
      }
    }

    if (!guestPortalToken) {
      const token = generateToken();
      const guestUuid = Array.isArray(booking.occupants) && booking.occupants.length > 0
        ? booking.occupants[0]
        : null;

      await firebase.set(`guestSessionsByToken/${token}`, {
        bookingId,
        guestUuid,
        createdAt: now.toISOString(),
        expiresAt: computeTokenExpiry(booking, now),
      });

      if (booking.guestPortalToken && booking.guestPortalToken !== token) {
        try {
          await firebase.delete(`guestSessionsByToken/${booking.guestPortalToken}`);
        } catch (error) {
          console.warn('Failed to delete previous guest token:', error);
        }
      }

      await firebase.update(`bookings/${bookingId}`, { guestPortalToken: token });
      guestPortalToken = token;
    }

    // Check if check-in code exists, generate if not
    let checkInCode = booking.checkInCode;

    if (!checkInCode) {
      // Generate and save new check-in code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      checkInCode = '';
      for (let i = 0; i < 6; i++) {
        checkInCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await firebase.update(`bookings/${bookingId}`, { checkInCode });
      await firebase.set(`checkInCodesByCode/${checkInCode}`, {
        bookingId,
        expiresAt: expiresAt.toISOString(),
      });
    }

    // Reset rate limit on success
    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.delete(rateLimitKey);
    }

    return jsonResponse({ redirectUrl: `/g/${guestPortalToken}` });
  } catch (error) {
    console.error('Error finding booking:', error);
    return errorResponse('Failed to find booking', 500);
  }
};

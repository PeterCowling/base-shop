/**
 * CF Pages Function: /api/guest-session
 *
 * GET  - Validates token existence/expiry (no PII)
 * POST - Verifies guest last name for a token and returns minimal session data
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
}

interface Booking {
  guestName?: string;
  [key: string]: unknown;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function normalizeLastName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  return fullName.trim().split(' ').pop()?.toLowerCase() || '';
}

function normalizeInput(input: string | undefined | null): string {
  return (input || '').trim().toLowerCase();
}

function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0] || '';
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return errorResponse('token parameter is required', 400);
  }

  try {
    const firebase = new FirebaseRest(env);
    const session = await firebase.get<GuestSessionToken>(`guestSessionsByToken/${token}`);

    if (!session) {
      return errorResponse('Token not found', 404);
    }

    if (isExpired(session.expiresAt)) {
      return errorResponse('Token expired', 410);
    }

    return jsonResponse({ status: 'ok', expiresAt: session.expiresAt });
  } catch (error) {
    console.error('Error validating guest token:', error);
    return errorResponse('Failed to validate token', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let token = '';
  let lastName = '';

  try {
    const body = await request.json() as { token?: string; lastName?: string };
    token = body.token || '';
    lastName = body.lastName || '';
  } catch (error) {
    return errorResponse('Invalid JSON body', 400);
  }

  if (!token || !lastName) {
    return errorResponse('token and lastName are required', 400);
  }

  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `guest-verify:${clientIP}:${token}`;

  if (env.RATE_LIMIT) {
    const attempts = await env.RATE_LIMIT.get(rateLimitKey);
    if (attempts && parseInt(attempts, 10) >= MAX_ATTEMPTS) {
      return errorResponse('Too many attempts. Please try again later.', 429);
    }
  }

  try {
    const firebase = new FirebaseRest(env);
    const session = await firebase.get<GuestSessionToken>(`guestSessionsByToken/${token}`);

    if (!session) {
      return errorResponse('Token not found', 404);
    }

    if (isExpired(session.expiresAt)) {
      return errorResponse('Token expired', 410);
    }

    const booking = await firebase.get<Booking>(`bookings/${session.bookingId}`);
    if (!booking) {
      return errorResponse('Booking not found', 404);
    }

    const bookingLastName = normalizeLastName(booking.guestName);
    const inputLastName = normalizeInput(lastName);

    if (!bookingLastName || bookingLastName !== inputLastName) {
      if (env.RATE_LIMIT) {
        const currentAttempts = await env.RATE_LIMIT.get(rateLimitKey);
        const newAttempts = (parseInt(currentAttempts || '0', 10) + 1).toString();
        await env.RATE_LIMIT.put(rateLimitKey, newAttempts, {
          expirationTtl: WINDOW_MS / 1000,
        });
      }

      return errorResponse('Verification failed', 403);
    }

    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.delete(rateLimitKey);
    }

    return jsonResponse({
      bookingId: session.bookingId,
      guestUuid: session.guestUuid,
      guestFirstName: getFirstName(booking.guestName),
    });
  } catch (error) {
    console.error('Error verifying guest session:', error);
    return errorResponse('Failed to verify guest session', 500);
  }
};

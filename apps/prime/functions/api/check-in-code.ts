/**
 * CF Pages Function: /api/check-in-code
 *
 * GET: Retrieves check-in code for a booking
 * POST: Generates a new check-in code for a booking
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface CheckInCode {
  code: string;
  bookingId: string;
  createdAt: string;
  expiresAt: string;
}

function generateCode(): string {
  // Generate 6 character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');

  if (!bookingId) {
    return errorResponse('bookingId parameter is required', 400);
  }

  try {
    const firebase = new FirebaseRest(env);
    const checkInCode = await firebase.get<CheckInCode>(`checkInCodes/${bookingId}`);

    if (!checkInCode) {
      return errorResponse('No check-in code found for this booking', 404);
    }

    // Check if expired
    if (new Date(checkInCode.expiresAt) < new Date()) {
      return errorResponse('Check-in code has expired', 410);
    }

    return jsonResponse({ code: checkInCode.code });
  } catch (error) {
    console.error('Error fetching check-in code:', error);
    return errorResponse('Failed to fetch check-in code', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { bookingId: string };

    if (!body.bookingId) {
      return errorResponse('bookingId is required', 400);
    }

    const firebase = new FirebaseRest(env);

    // Generate new code
    const code = generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const checkInCode: CheckInCode = {
      code,
      bookingId: body.bookingId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Save code by bookingId for lookup by booking
    await firebase.set(`checkInCodes/${body.bookingId}`, checkInCode);

    // Also save reverse lookup by code
    await firebase.set(`checkInCodesByCode/${code}`, {
      bookingId: body.bookingId,
      expiresAt: expiresAt.toISOString(),
    });

    return jsonResponse({ code });
  } catch (error) {
    console.error('Error generating check-in code:', error);
    return errorResponse('Failed to generate check-in code', 500);
  }
};

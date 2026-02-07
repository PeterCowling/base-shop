/**
 * CF Pages Function: /api/extension-request
 *
 * Guest extension requests:
 * - validates guest session token
 * - applies per-guest rate limiting and dedupe window
 * - writes a canonical Prime request record for reception ingest
 * - dispatches a structured email payload to operations
 */

import { dispatchPrimeEmail } from '../lib/email-dispatch';
import { FirebaseRest, errorResponse, jsonResponse } from '../lib/firebase-rest';
import { validateGuestSessionToken } from '../lib/guest-session';
import { buildPrimeRequestId, createPrimeRequestRecord, createPrimeRequestWritePayload } from '../lib/prime-requests';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  PRIME_EMAIL_WEBHOOK_URL?: string;
  PRIME_EMAIL_WEBHOOK_TOKEN?: string;
}

interface ExtensionRequestBody {
  token?: string;
  requestedCheckOutDate?: string;
  note?: string;
}

interface BookingOccupantRecord {
  checkOutDate?: string;
  firstName?: string;
  lastName?: string;
}

const TARGET_EMAIL = 'hostelbrikette@gmail.com';
const MAX_REQUESTS_PER_HOUR = 3;
const REQUEST_WINDOW_SECONDS = 60 * 60;
const DEDUPE_WINDOW_SECONDS = 10 * 60;

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: ExtensionRequestBody;
  try {
    body = await request.json() as ExtensionRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const token = body.token ?? null;
  const requestedCheckOutDate = (body.requestedCheckOutDate ?? '').trim();
  const note = (body.note ?? '').trim();

  if (!requestedCheckOutDate || !isIsoDate(requestedCheckOutDate)) {
    return errorResponse('requestedCheckOutDate must be ISO YYYY-MM-DD', 400);
  }
  if (note.length > 500) {
    return errorResponse('note must be 500 characters or fewer', 400);
  }

  try {
    const authResult = await validateGuestSessionToken(token, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const guestUuid = authResult.session.guestUuid;
    if (!guestUuid) {
      return errorResponse('guestUuid missing for session', 422);
    }

    if (env.RATE_LIMIT) {
      const rateLimitKey = `extension-rate:${guestUuid}`;
      const rawCount = await env.RATE_LIMIT.get(rateLimitKey);
      const count = parseInt(rawCount ?? '0', 10);
      if (count >= MAX_REQUESTS_PER_HOUR) {
        return errorResponse('Too many extension requests. Please wait before retrying.', 429);
      }
      await env.RATE_LIMIT.put(rateLimitKey, String(count + 1), {
        expirationTtl: REQUEST_WINDOW_SECONDS,
      });
    }

    if (env.RATE_LIMIT) {
      const dedupeKey = `extension-dedupe:${guestUuid}:${requestedCheckOutDate}`;
      const existing = await env.RATE_LIMIT.get(dedupeKey);
      if (existing) {
        return jsonResponse({
          success: true,
          deduplicated: true,
          requestId: existing,
          message: 'Extension request already submitted recently.',
        });
      }
    }

    const firebase = new FirebaseRest(env);
    const occupant = await firebase.get<BookingOccupantRecord>(
      `bookings/${authResult.session.bookingId}/${guestUuid}`,
    );

    if (!occupant?.checkOutDate) {
      return errorResponse('Current checkout date unavailable for this booking', 422);
    }

    if (compareIsoDates(requestedCheckOutDate, occupant.checkOutDate) <= 0) {
      return errorResponse('requestedCheckOutDate must be after current checkout date', 400);
    }

    const guestName = `${occupant.firstName ?? ''} ${occupant.lastName ?? ''}`.trim() || 'Guest';
    const requestId = buildPrimeRequestId('extension');
    const requestRecord = createPrimeRequestRecord({
      requestId,
      type: 'extension',
      bookingId: authResult.session.bookingId,
      guestUuid,
      guestName,
      note,
      payload: {
        currentCheckOutDate: occupant.checkOutDate,
        requestedCheckOutDate,
      },
    });

    await firebase.update('/', createPrimeRequestWritePayload(requestRecord));

    const emailText = [
      'Prime extension request received.',
      `Booking: ${authResult.session.bookingId}`,
      `Guest UUID: ${guestUuid}`,
      `Guest name: ${guestName}`,
      `Current checkout: ${occupant.checkOutDate}`,
      `Requested checkout: ${requestedCheckOutDate}`,
      `Note: ${note || '(none)'}`,
      `Request ID: ${requestId}`,
    ].join('\n');

    const dispatchResult = await dispatchPrimeEmail(
      {
        to: TARGET_EMAIL,
        subject: `[Prime] Extension request ${authResult.session.bookingId}`,
        text: emailText,
      },
      env,
    );

    if (env.RATE_LIMIT) {
      const dedupeKey = `extension-dedupe:${guestUuid}:${requestedCheckOutDate}`;
      await env.RATE_LIMIT.put(dedupeKey, requestId, {
        expirationTtl: DEDUPE_WINDOW_SECONDS,
      });
    }

    return jsonResponse({
      success: true,
      requestId,
      deliveryMode: dispatchResult.deliveryMode,
      message: 'Extension request sent. Reception usually replies by email within one business day.',
    });
  } catch (error) {
    console.error('Failed to create extension request:', error);
    return errorResponse('Failed to submit extension request', 500);
  }
};

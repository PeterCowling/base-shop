/**
 * CF Pages Function: /api/extension-request
 *
 * Guest extension requests:
 * - validates guest session token
 * - applies per-guest rate limiting and dedupe window
 * - writes a canonical Prime request record for reception ingest
 * - dispatches a structured email payload to operations
 */

import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { createFunctionTranslator } from '../lib/function-i18n';
import { validateGuestSessionToken } from '../lib/guest-session';
import { createPrimeRequestRecord, createPrimeRequestWritePayload } from '../lib/prime-requests';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  PRIME_EXTENSION_TARGET_EMAIL?: string;
  RATE_LIMIT?: KVNamespace;
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

const MAX_REQUESTS_PER_HOUR = 3;
const REQUEST_WINDOW_SECONDS = 60 * 60;
const DEDUPE_WINDOW_SECONDS = 10 * 60;

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

function normalizeRequestIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildDeterministicExtensionRequestId(input: {
  bookingId: string;
  guestUuid: string;
  requestedCheckOutDate: string;
}): string {
  const bookingPart = normalizeRequestIdPart(input.bookingId);
  const guestPart = normalizeRequestIdPart(input.guestUuid);
  const datePart = input.requestedCheckOutDate.replace(/-/g, '');
  return `extension_${bookingPart}_${guestPart}_${datePart}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { t } = createFunctionTranslator(request, 'ExtensionRequestApi');

  let body: ExtensionRequestBody;
  try {
    body = await request.json() as ExtensionRequestBody;
  } catch {
    return errorResponse(t('errors.invalidJsonBody'), 400);
  }

  const token = body.token ?? null;
  const requestedCheckOutDate = (body.requestedCheckOutDate ?? '').trim();
  const note = (body.note ?? '').trim();
  const targetEmail = env.PRIME_EXTENSION_TARGET_EMAIL?.trim() ?? '';

  if (!requestedCheckOutDate || !isIsoDate(requestedCheckOutDate)) {
    return errorResponse(t('errors.requestedCheckOutDateIso'), 400);
  }
  if (note.length > 500) {
    return errorResponse(t('errors.noteTooLong'), 400);
  }
  if (!targetEmail) {
    return errorResponse(t('errors.targetEmailNotConfigured'), 500);
  }

  try {
    const authResult = await validateGuestSessionToken(token, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const guestUuid = authResult.session.guestUuid;
    if (!guestUuid) {
      return errorResponse(t('errors.guestUuidMissing'), 422);
    }

    if (env.RATE_LIMIT) {
      const dedupeKey = `extension-dedupe:${guestUuid}:${requestedCheckOutDate}`;
      const existing = await env.RATE_LIMIT.get(dedupeKey);
      if (existing) {
        return jsonResponse({
          success: true,
          deduplicated: true,
          requestId: existing,
          message: t('messages.deduplicated'),
        });
      }
    }

    if (env.RATE_LIMIT) {
      const rateLimitKey = `extension-rate:${guestUuid}`;
      const rawCount = await env.RATE_LIMIT.get(rateLimitKey);
      const count = parseInt(rawCount ?? '0', 10);
      if (count >= MAX_REQUESTS_PER_HOUR) {
        return errorResponse(t('errors.rateLimitExceeded'), 429);
      }
      await env.RATE_LIMIT.put(rateLimitKey, String(count + 1), {
        expirationTtl: REQUEST_WINDOW_SECONDS,
      });
    }

    const firebase = new FirebaseRest(env);
    const occupant = await firebase.get<BookingOccupantRecord>(
      `bookings/${authResult.session.bookingId}/${guestUuid}`,
    );

    if (!occupant?.checkOutDate) {
      return errorResponse(t('errors.currentCheckoutUnavailable'), 422);
    }

    if (compareIsoDates(requestedCheckOutDate, occupant.checkOutDate) <= 0) {
      return errorResponse(t('errors.requestedCheckoutAfterCurrent'), 400);
    }

    const guestName =
      `${occupant.firstName ?? ''} ${occupant.lastName ?? ''}`.trim()
      || t('requestRecord.defaultGuestName');
    const requestId = buildDeterministicExtensionRequestId({
      bookingId: authResult.session.bookingId,
      guestUuid,
      requestedCheckOutDate,
    });
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

    const emailText = [
      t('outboundDraft.body.intro'),
      t('outboundDraft.body.booking', { bookingId: authResult.session.bookingId }),
      t('outboundDraft.body.guestUuid', { guestUuid }),
      t('outboundDraft.body.guestName', { guestName }),
      t('outboundDraft.body.currentCheckout', { currentCheckOutDate: occupant.checkOutDate }),
      t('outboundDraft.body.requestedCheckout', { requestedCheckOutDate }),
      t('outboundDraft.body.note', {
        note: note || t('outboundDraft.body.none'),
      }),
      t('outboundDraft.body.requestId', { requestId }),
    ].join('\n');

    const writePayload = {
      ...createPrimeRequestWritePayload(requestRecord),
      [`outboundDrafts/${requestId}`]: {
        to: targetEmail,
        subject: t('outboundDraft.subject', { bookingId: authResult.session.bookingId }),
        bodyText: emailText,
        category: 'extension-ops',
        guestName,
        bookingCode: authResult.session.bookingId,
        eventId: requestId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };

    await firebase.update('/', writePayload);

    if (env.RATE_LIMIT) {
      const dedupeKey = `extension-dedupe:${guestUuid}:${requestedCheckOutDate}`;
      await env.RATE_LIMIT.put(dedupeKey, requestId, {
        expirationTtl: DEDUPE_WINDOW_SECONDS,
      });
    }

    return jsonResponse({
      success: true,
      requestId,
      deliveryMode: 'outbox',
      message: t('messages.submitted'),
    });
  } catch (error) {
    console.error('Failed to create extension request:', error);
    return errorResponse(t('errors.submitFailed'), 500);
  }
};

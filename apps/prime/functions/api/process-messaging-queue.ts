import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { createGuestDeepLink } from '../lib/guest-token';
import { dispatchQueuedArrival48HoursEvent } from '../lib/messaging-dispatcher';
import { writeOutboundDraft } from '../lib/outbound-draft';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  PRIME_EMAIL_WEBHOOK_TOKEN?: string;
  PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET?: string;
  RATE_LIMIT?: KVNamespace;
}

interface ProcessQueueRequestBody {
  eventId?: string;
}

const PROCESS_QUEUE_MAX_REQUESTS_PER_MINUTE = 30;
const PROCESS_QUEUE_RATE_LIMIT_WINDOW_SECONDS = 90;
const QUEUE_SIGNATURE_MAX_AGE_SECONDS = 5 * 60;
const QUEUE_SIGNATURE_TIMESTAMP_HEADER = 'X-Prime-Queue-Timestamp';
const QUEUE_SIGNATURE_HEADER = 'X-Prime-Queue-Signature';

function unauthorizedResponse(): Response {
  return errorResponse('Unauthorized', 401);
}

function missingProviderConfigResponse(): Response {
  return errorResponse('Prime email provider is not configured', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
}

function currentMinuteBucket(nowMs: number): number {
  return Math.floor(nowMs / 60_000);
}

function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}

function constantTimeEqual(a: string, b: string): boolean {
  const aNorm = normalizeHex(a);
  const bNorm = normalizeHex(b);
  if (aNorm.length !== bNorm.length || aNorm.length === 0) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < aNorm.length; index += 1) {
    mismatch |= aNorm.charCodeAt(index) ^ bNorm.charCodeAt(index);
  }
  return mismatch === 0;
}

async function computeQueueRequestSignature(
  queueToken: string,
  timestampSeconds: string,
  rawBody: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(queueToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const payload = `${timestampSeconds}.${rawBody}`;
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyQueueRequestSignature(
  request: Request,
  signatureSecret: string,
  rawBody: string,
): Promise<boolean> {
  const timestampHeader = request.headers.get(QUEUE_SIGNATURE_TIMESTAMP_HEADER)?.trim() ?? '';
  const providedSignature = request.headers.get(QUEUE_SIGNATURE_HEADER)?.trim() ?? '';

  if (!timestampHeader || !providedSignature || !/^\d+$/.test(timestampHeader)) {
    return false;
  }

  const timestampSeconds = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > QUEUE_SIGNATURE_MAX_AGE_SECONDS) {
    return false;
  }

  const expectedSignature = await computeQueueRequestSignature(
    signatureSecret,
    timestampHeader,
    rawBody,
  );
  return constantTimeEqual(providedSignature, expectedSignature);
}

async function enforceQueueReplayGuard(
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (!env.RATE_LIMIT) {
    return null;
  }
  const timestampHeader = request.headers.get(QUEUE_SIGNATURE_TIMESTAMP_HEADER)?.trim() ?? '';
  const providedSignature = request.headers.get(QUEUE_SIGNATURE_HEADER)?.trim() ?? '';
  if (!timestampHeader || !providedSignature) {
    return unauthorizedResponse();
  }

  const signatureKey = normalizeHex(providedSignature);
  const replayKey = `process-messaging-queue:replay:${timestampHeader}:${signatureKey}`;
  const alreadySeen = await env.RATE_LIMIT.get(replayKey);
  if (alreadySeen) {
    return unauthorizedResponse();
  }

  await env.RATE_LIMIT.put(replayKey, '1', {
    expirationTtl: QUEUE_SIGNATURE_MAX_AGE_SECONDS,
  });
  return null;
}

async function enforceQueueRequestRateLimit(
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (!env.RATE_LIMIT) {
    return null;
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bucket = currentMinuteBucket(Date.now());
  const key = `process-messaging-queue:${clientIp}:${bucket}`;
  const rawCount = await env.RATE_LIMIT.get(key);
  const count = Number.parseInt(rawCount ?? '0', 10);
  if (count >= PROCESS_QUEUE_MAX_REQUESTS_PER_MINUTE) {
    return errorResponse('Too many queue processing requests. Please retry shortly.', 429);
  }

  await env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: PROCESS_QUEUE_RATE_LIMIT_WINDOW_SECONDS,
  });

  return null;
}

/**
 * Derive the public base URL from the incoming request.
 * In production this is the custom domain; in staging the Pages preview URL.
 */
function deriveBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const queueToken = env.PRIME_EMAIL_WEBHOOK_TOKEN?.trim();
  if (!queueToken) {
    return missingProviderConfigResponse();
  }
  const signatureSecret = env.PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET?.trim() || queueToken;

  const authHeader = request.headers.get('Authorization')?.trim() ?? '';
  if (authHeader !== `Bearer ${queueToken}`) {
    return unauthorizedResponse();
  }

  const rateLimitResponse = await enforceQueueRequestRateLimit(request, env);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse('Invalid request body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const signatureValid = await verifyQueueRequestSignature(
    request,
    signatureSecret,
    rawBody,
  );
  if (!signatureValid) {
    return unauthorizedResponse();
  }

  const replayResponse = await enforceQueueReplayGuard(request, env);
  if (replayResponse) {
    return replayResponse;
  }

  let body: ProcessQueueRequestBody;
  try {
    body = JSON.parse(rawBody) as ProcessQueueRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const eventId = (body.eventId ?? '').trim();
  if (!eventId) {
    return errorResponse('eventId is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const queueStore = new FirebaseRest(env);
  const baseUrl = deriveBaseUrl(request);

  const result = await dispatchQueuedArrival48HoursEvent(eventId, {
    queueStore,
    dispatchArrival48Hours: async (payload, record) => {
      // Look up checkout date from booking for token expiry
      const booking = await queueStore.get<{ checkOutDate?: string }>(
        `bookings/${payload.bookingCode}/${payload.uuid}`,
      );
      const checkOutDate = booking?.checkOutDate ?? '';
      if (!checkOutDate || Number.isNaN(Date.parse(checkOutDate))) {
        throw {
          message: `Invalid or missing checkout date for booking ${payload.bookingCode}/${payload.uuid}`,
          permanent: true,
        };
      }

      // Generate a secure deep link instead of the insecure UUID-based URL
      const deepLink = await createGuestDeepLink(queueStore, {
        bookingId: payload.bookingCode,
        guestUuid: payload.uuid,
        checkOutDate,
        baseUrl,
      });

      const totalCash = (payload.cityTaxDue + payload.depositDue).toFixed(2);
      const guideUrl = 'https://www.hostelbrikette.com/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage';

      const subject = `Arriving soon, ${payload.firstName} — read this before you travel`;
      const bodyText = [
        `Hi ${payload.firstName},`,
        '',
        'Please DO NOT arrive by ferry and walk up to the hostel with luggage!',
        '',
        'Ignore any Google Maps advice that says "15 minute walk" — it will be 30 minutes of carrying your luggage up stairs.', // i18n-exempt -- PRIME-101 transactional email copy [ttl=2026-12-31]
        '',
        'Your options:', // i18n-exempt -- PRIME-101 transactional email copy [ttl=2026-12-31]
        '',
        '1. Give your bags to the porters at the ferry dock and have them bring them up. They are reliable — best EUR 15 you could spend.', // i18n-exempt -- PRIME-101 transactional email copy [ttl=2026-12-31]
        '',
        `2. Take the interno bus from Piazza dei Mulini to Chiesa Nuova (just a few euros, gets you within 100m of the hostel). Full guide: ${guideUrl}`,
        '',
        `Please bring EUR ${totalCash} in cash for city tax and key deposit.`,
        '',
        `Plan your route and confirm your arrival time in your guest portal:`,
        deepLink,
        '',
        'See you soon!',
        '',
        'Hostel Brikette', // i18n-exempt -- PRIME-101 brand signature in transactional email [ttl=2026-12-31]
      ].join('\n');

      await writeOutboundDraft(queueStore, record.eventId, {
        to: payload.email,
        subject,
        bodyText,
        category: 'pre-arrival',
        guestName: payload.firstName,
        bookingCode: payload.bookingCode,
        eventId: record.eventId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    },
  });

  return jsonResponse(result);
};

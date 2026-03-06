/**
 * CF Pages Function: /api/check-in-code
 *
 * GET: Retrieve existing check-in code for a guest UUID
 * POST: Generate a new check-in code for a guest UUID (with collision detection)
 *
 * Code format: "BRK-XXXXX" (5 alphanumeric chars after prefix)
 * Expiry: 48 hours after checkout date
 *
 * Firebase paths:
 *   checkInCodes/byCode/{code} — staff lookup by code
 *   checkInCodes/byUuid/{uuid} — guest lookup by UUID
 *
 * Auth: requires a valid guest session token in Authorization: Bearer header.
 * Rate limit: POST endpoint — 5 requests per 15 min per IP (RATE_LIMIT KV).
 */

import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { createFunctionTranslator } from '../lib/function-i18n';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface CheckInCodeRecord {
  code: string;
  uuid: string;
  createdAt: number;
  expiresAt: number;
}

interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
}

const CODE_PREFIX = 'BRK-';
const CODE_LENGTH = 5;
const CODE_EXPIRY_HOURS_AFTER_CHECKOUT = 48;
const MAX_COLLISION_ATTEMPTS = 10;

/** Characters excluding confusing ones (0, O, 1, I, L) */
const CODE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Generates a cryptographically random BRK-XXXXX code. */
function generateCode(): string {
  const arr = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARACTERS[arr[i] % CODE_CHARACTERS.length];
  }
  return `${CODE_PREFIX}${code}`;
}

function calculateExpiry(checkOutDate: string): number | null {
  const checkOutTimestamp = Date.parse(checkOutDate);
  if (!Number.isFinite(checkOutTimestamp)) {
    return null;
  }

  return checkOutTimestamp + CODE_EXPIRY_HOURS_AFTER_CHECKOUT * 60 * 60 * 1000;
}

/** Extracts the bearer token from the Authorization header. Returns null if absent or malformed. */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Validates a guest session token against Firebase.
 * Returns the guestUuid associated with the token, or null if invalid/expired.
 */
async function validateGuestSessionToken(
  firebase: FirebaseRest,
  token: string,
): Promise<string | null> {
  const session = await firebase.get<GuestSessionToken>(`guestSessionsByToken/${token}`);
  if (!session) {
    return null;
  }
  if (new Date(session.expiresAt) <= new Date()) {
    return null;
  }
  return session.guestUuid ?? null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { t } = createFunctionTranslator(request, 'CheckInCodeApi');
  const url = new URL(request.url);
  const uuid = url.searchParams.get('uuid');

  if (!uuid) {
    return errorResponse(t('errors.uuidQueryRequired'), 400);
  }

  const token = extractBearerToken(request);
  if (!token) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const firebase = new FirebaseRest(env);

    const sessionGuestUuid = await validateGuestSessionToken(firebase, token);
    if (!sessionGuestUuid) {
      return errorResponse('Unauthorized', 401);
    }

    if (sessionGuestUuid !== uuid) {
      return errorResponse('Forbidden', 403);
    }

    const record = await firebase.get<CheckInCodeRecord>(`checkInCodes/byUuid/${uuid}`);

    if (!record) {
      return jsonResponse({ code: null });
    }

    const expiresAt = Number(record.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return jsonResponse({ code: null, expired: true });
    }

    return jsonResponse({ code: record.code, expiresAt });
  } catch (error) {
    console.error('Error fetching check-in code:', error);
    return errorResponse(t('errors.fetchFailed'), 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { t } = createFunctionTranslator(request, 'CheckInCodeApi');

  const token = extractBearerToken(request);
  if (!token) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const firebase = new FirebaseRest(env);

    const sessionGuestUuid = await validateGuestSessionToken(firebase, token);
    if (!sessionGuestUuid) {
      return errorResponse('Unauthorized', 401);
    }

    // Rate limiting — track every POST attempt per IP
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const rateLimitKey = `cic:${ip}`;

    if (env.RATE_LIMIT) {
      const stored = await env.RATE_LIMIT.get(rateLimitKey);
      const currentAttempts = stored ? parseInt(stored, 10) : 0;
      if (currentAttempts >= MAX_ATTEMPTS) {
        return errorResponse('Too many attempts. Please try again later.', 429);
      }
      await env.RATE_LIMIT.put(rateLimitKey, String(currentAttempts + 1), {
        expirationTtl: WINDOW_MS / 1000,
      });
    }

    const body = (await request.json()) as { uuid?: string; checkOutDate?: string };

    if (!body.uuid) {
      return errorResponse(t('errors.uuidRequired'), 400);
    }

    if (!body.checkOutDate) {
      return errorResponse(t('errors.checkOutDateRequired'), 400);
    }

    const expiresAt = calculateExpiry(body.checkOutDate);
    if (expiresAt === null) {
      return errorResponse(t('errors.checkOutDateInvalid'), 400);
    }

    // Check if code already exists and is not expired
    const existing = await firebase.get<CheckInCodeRecord>(`checkInCodes/byUuid/${body.uuid}`);
    if (existing) {
      const existingExpiry = Number(existing.expiresAt);
      if (Number.isFinite(existingExpiry) && existingExpiry > Date.now()) {
        // Reset rate limit counter on success
        if (env.RATE_LIMIT) {
          await env.RATE_LIMIT.delete(rateLimitKey);
        }
        return jsonResponse({ code: existing.code, expiresAt: existingExpiry, existing: true });
      }
    }

    // Generate new code with collision detection
    let code: string;
    let attempts = 0;

    do {
      code = generateCode();
      attempts++;

      const existingCode = await firebase.get<CheckInCodeRecord>(`checkInCodes/byCode/${code}`);
      if (!existingCode) {
        break; // Code is unique
      }

      if (attempts >= MAX_COLLISION_ATTEMPTS) {
        return errorResponse(t('errors.uniqueCodeGenerationFailed'), 500);
      }
    } while (true);

    const now = Date.now();
    const record: CheckInCodeRecord = {
      code,
      uuid: body.uuid,
      createdAt: now,
      expiresAt,
    };

    // Write to both indexes
    await firebase.set(`checkInCodes/byCode/${code}`, record);
    await firebase.set(`checkInCodes/byUuid/${body.uuid}`, record);

    // Reset rate limit counter on success
    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.delete(rateLimitKey);
    }

    return jsonResponse({ code, expiresAt, created: true });
  } catch (error) {
    console.error('Error generating check-in code:', error);
    return errorResponse(t('errors.generateFailed'), 500);
  }
};

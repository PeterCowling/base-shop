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
 */

import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { createFunctionTranslator } from '../lib/function-i18n';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface CheckInCodeRecord {
  code: string;
  uuid: string;
  createdAt: number;
  expiresAt: number;
}

const CODE_PREFIX = 'BRK-';
const CODE_LENGTH = 5;
const CODE_EXPIRY_HOURS_AFTER_CHECKOUT = 48;
const MAX_COLLISION_ATTEMPTS = 10;

/** Characters excluding confusing ones (0, O, 1, I, L) */
const CODE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARACTERS.charAt(Math.floor(Math.random() * CODE_CHARACTERS.length));
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { t } = createFunctionTranslator(request, 'CheckInCodeApi');
  const url = new URL(request.url);
  const uuid = url.searchParams.get('uuid');

  if (!uuid) {
    return errorResponse(t('errors.uuidQueryRequired'), 400);
  }

  try {
    const firebase = new FirebaseRest(env);
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
  try {
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

    const firebase = new FirebaseRest(env);

    // Check if code already exists and is not expired
    const existing = await firebase.get<CheckInCodeRecord>(`checkInCodes/byUuid/${body.uuid}`);
    if (existing) {
      const existingExpiry = Number(existing.expiresAt);
      if (Number.isFinite(existingExpiry) && existingExpiry > Date.now()) {
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

    return jsonResponse({ code, expiresAt, created: true });
  } catch (error) {
    console.error('Error generating check-in code:', error);
    return errorResponse(t('errors.generateFailed'), 500);
  }
};

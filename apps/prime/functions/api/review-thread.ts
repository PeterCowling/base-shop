import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { getPrimeReviewThreadDetail } from '../lib/prime-review-api';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const threadId = new URL(request.url).searchParams.get('threadId')?.trim() ?? '';
  if (!threadId) {
    return errorResponse('threadId is required', 400);
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review reads', 503);
  }

  try {
    const detail = await getPrimeReviewThreadDetail(getPrimeMessagingDb(env), threadId);
    if (!detail) {
      return errorResponse(`Prime review thread ${threadId} not found`, 404);
    }

    return jsonResponse({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error('Failed to load Prime review thread:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to load Prime review thread', 500);
  }
};

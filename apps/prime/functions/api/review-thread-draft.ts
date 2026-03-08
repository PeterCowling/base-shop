import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { savePrimeReviewDraft } from '../lib/prime-review-drafts';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

interface ReviewThreadDraftRequestBody {
  plainText?: string;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const threadId = new URL(request.url).searchParams.get('threadId')?.trim() ?? '';
  if (!threadId) {
    return errorResponse('threadId is required', 400);
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503);
  }

  let body: ReviewThreadDraftRequestBody;
  try {
    body = await request.json() as ReviewThreadDraftRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const plainText = body.plainText?.trim() ?? '';
  if (!plainText) {
    return errorResponse('plainText is required', 400);
  }

  try {
    const result = await savePrimeReviewDraft(getPrimeMessagingDb(env), {
      threadId,
      actorUid: request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner',
      content: plainText,
    });

    if (result.outcome === 'not_found') {
      return errorResponse(`Prime review thread ${threadId} not found`, 404);
    }
    if (result.outcome === 'conflict') {
      return errorResponse(result.message, 409);
    }

    return jsonResponse({
      success: true,
      data: {
        detail: result.detail,
      },
    });
  } catch (error) {
    console.error('Failed to save Prime review draft:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to save Prime review draft', 500);
  }
};

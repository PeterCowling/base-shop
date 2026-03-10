import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { sendPrimeReviewThread } from '../lib/prime-review-send';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env extends FirebaseEnv {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

  try {
    const result = await sendPrimeReviewThread(getPrimeMessagingDb(env), env, {
      threadId,
      actorUid: request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner',
      actorSource: 'reception_proxy',
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
        thread: result.thread,
        draft: result.draft,
        campaign: result.campaign,
        sentMessageId: result.sentMessageId,
      },
    });
  } catch (error) {
    console.error('Failed to send Prime review thread:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to send Prime review thread', 500);
  }
};

import type { D1Database } from '@acme/platform-core/d1';

import {
  isActorClaimsResponse,
  resolveActorClaimsWithCompat,
} from '../lib/actor-claims-resolver';
import { errorResponse, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { mutatePrimeReviewThread } from '../lib/prime-review-mutations';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
  PRIME_ACTOR_CLAIMS_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const claimsResult = await resolveActorClaimsWithCompat(request, env);
  if (isActorClaimsResponse(claimsResult)) {
    return claimsResult;
  }
  const { uid: actorUid } = claimsResult;

  const threadId = new URL(request.url).searchParams.get('threadId')?.trim() ?? '';
  if (!threadId) {
    return errorResponse('threadId is required', 400);
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503);
  }

  try {
    const result = await mutatePrimeReviewThread(getPrimeMessagingDb(env), {
      action: 'dismiss',
      threadId,
      actorUid,
      actorSource: 'reception',
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
      },
    });
  } catch (error) {
    console.error('Failed to dismiss Prime review thread:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to dismiss Prime review thread', 500);
  }
};

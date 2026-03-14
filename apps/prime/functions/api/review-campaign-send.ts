import type { D1Database } from '@acme/platform-core/d1';

import {
  isActorClaimsResponse,
  resolveActorClaims,
} from '../lib/actor-claims-resolver';
import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { enforceKvRateLimit } from '../lib/kv-rate-limit';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { sendPrimeReviewCampaign } from '../lib/prime-review-campaign-actions';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

const BROADCAST_SEND_RATE_LIMIT_MAX_REQUESTS = 3;
const BROADCAST_SEND_RATE_LIMIT_WINDOW_SECONDS = 60;

interface Env extends FirebaseEnv {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
  RATE_LIMIT?: KVNamespace;
  PRIME_ACTOR_CLAIMS_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const claimsResult = await resolveActorClaims(request, env);
  if (isActorClaimsResponse(claimsResult)) {
    return claimsResult;
  }
  const { uid: actorUid } = claimsResult;

  const rateLimitResponse = await enforceKvRateLimit({
    kv: env.RATE_LIMIT,
    key: `ratelimit:broadcast_send:${actorUid}`,
    maxRequests: BROADCAST_SEND_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: BROADCAST_SEND_RATE_LIMIT_WINDOW_SECONDS,
    errorMessage: 'Broadcast send rate limit exceeded. Wait 60 seconds.', // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const campaignId = new URL(request.url).searchParams.get('campaignId')?.trim() ?? '';
  if (!campaignId) {
    return errorResponse('campaignId is required', 400);
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503);
  }

  try {
    const result = await sendPrimeReviewCampaign(getPrimeMessagingDb(env), env, {
      campaignId,
      actorUid,
      actorSource: 'reception_proxy',
    });

    if (result.outcome === 'not_found') {
      return errorResponse(`Prime review campaign ${campaignId} not found`, 404);
    }
    if (result.outcome === 'conflict') {
      return errorResponse(result.message, 409);
    }

    return jsonResponse({
      success: true,
      data: {
        campaign: result.campaign,
        sentMessageId: result.sentMessageId,
      },
    });
  } catch (error) {
    console.error('Failed to send Prime review campaign:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to send Prime review campaign', 500);
  }
};

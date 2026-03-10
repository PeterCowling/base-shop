import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { sendPrimeReviewCampaign } from '../lib/prime-review-campaign-actions';
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
      actorUid: request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner',
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

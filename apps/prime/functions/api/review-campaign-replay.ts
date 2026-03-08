import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { replayPrimeReviewCampaignDelivery } from '../lib/prime-review-campaign-actions';
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

  const url = new URL(request.url);
  const campaignId = url.searchParams.get('campaignId')?.trim() ?? '';
  const deliveryId = url.searchParams.get('deliveryId')?.trim() ?? '';
  if (!campaignId) {
    return errorResponse('campaignId is required', 400);
  }
  if (!deliveryId) {
    return errorResponse('deliveryId is required', 400);
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503);
  }

  try {
    const result = await replayPrimeReviewCampaignDelivery(getPrimeMessagingDb(env), env, {
      campaignId,
      deliveryId,
    });

    if (result.outcome === 'not_found') {
      return errorResponse(`Prime review campaign delivery ${deliveryId} not found`, 404);
    }
    if (result.outcome === 'conflict') {
      return errorResponse(result.message, 409);
    }

    return jsonResponse({
      success: true,
      data: {
        campaign: result.campaign,
        deliveryId: result.deliveryId,
      },
    });
  } catch (error) {
    console.error('Failed to replay Prime review campaign delivery:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to replay Prime review campaign delivery', 500);
  }
};

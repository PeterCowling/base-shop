import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import {
  createPrimeReviewCampaign,
  getPrimeReviewCampaignDetail,
  updatePrimeReviewCampaign,
} from '../lib/prime-review-campaigns';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

type ReviewCampaignPayload = {
  threadId?: string;
  status?: 'drafting' | 'under_review' | 'sent' | 'resolved' | 'archived';
  title?: string | null;
  metadata?: Record<string, unknown> | null;
  latestDraftId?: string | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const campaignId = new URL(request.url).searchParams.get('campaignId')?.trim() ?? '';
  if (!campaignId) {
    return errorResponse('campaignId is required', 400);
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review reads', 503);
  }

  try {
    const campaign = await getPrimeReviewCampaignDetail(getPrimeMessagingDb(env), campaignId);
    if (!campaign) {
      return errorResponse(`Prime review campaign ${campaignId} not found`, 404);
    }

    return jsonResponse({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Failed to load Prime review campaign:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to load Prime review campaign', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503);
  }

  const body = (await request.json().catch(() => ({}))) as ReviewCampaignPayload;
  const threadId = body.threadId?.trim() ?? '';
  if (!threadId) {
    return errorResponse('threadId is required', 400);
  }

  try {
    const result = await createPrimeReviewCampaign(getPrimeMessagingDb(env), {
      threadId,
      actorUid: request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner',
      title: body.title ?? null,
      metadata: body.metadata ?? null,
      latestDraftId: body.latestDraftId ?? null,
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
        campaign: result.campaign,
      },
    });
  } catch (error) {
    console.error('Failed to create Prime review campaign:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to create Prime review campaign', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
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

  const body = (await request.json().catch(() => ({}))) as ReviewCampaignPayload;

  try {
    const result = await updatePrimeReviewCampaign(getPrimeMessagingDb(env), {
      campaignId,
      actorUid: request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner',
      status: body.status,
      title: body.title,
      metadata: body.metadata,
      latestDraftId: body.latestDraftId,
    });

    if (result.outcome === 'not_found') {
      return errorResponse(`Prime review campaign ${campaignId} not found`, 404);
    }

    return jsonResponse({
      success: true,
      data: {
        campaign: result.campaign,
      },
    });
  } catch (error) {
    console.error('Failed to update Prime review campaign:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to update Prime review campaign', 500);
  }
};

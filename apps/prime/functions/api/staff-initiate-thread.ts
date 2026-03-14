import type { D1Database } from '@acme/platform-core/d1';

import { WHOLE_HOSTEL_BROADCAST_CHANNEL_ID } from '../../src/lib/chat/directMessageChannel';
import {
  isActorClaimsResponse,
  resolveActorClaims,
} from '../lib/actor-claims-resolver';
import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { upsertPrimeMessageThread } from '../lib/prime-messaging-repositories';
import { savePrimeReviewDraft } from '../lib/prime-review-drafts';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env extends FirebaseEnv {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
  PRIME_ACTOR_CLAIMS_SECRET?: string;
}

interface StaffInitiateThreadRequestBody {
  plainText?: string;
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

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  let body: StaffInitiateThreadRequestBody;
  try {
    body = await request.json() as StaffInitiateThreadRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const plainText = body.plainText?.trim() ?? '';
  if (!plainText) {
    return errorResponse('plainText is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const db = getPrimeMessagingDb(env);

  try {
    await upsertPrimeMessageThread(db, {
      id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID,
      bookingId: '',
      channelType: 'broadcast',
      audience: 'whole_hostel',
    });

    const result = await savePrimeReviewDraft(db, {
      threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID,
      actorUid,
      content: plainText,
    });

    // not_found cannot occur after a successful upsert, but handle defensively
    if (result.outcome === 'not_found') {
      return errorResponse('Broadcast thread unavailable after upsert', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
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
    console.error('Failed to initiate staff broadcast thread:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to initiate staff broadcast thread', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
};

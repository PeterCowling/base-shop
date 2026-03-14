import type { D1Database } from '@acme/platform-core/d1';

import {
  isActorClaimsResponse,
  resolveActorClaimsWithCompat,
} from '../lib/actor-claims-resolver';
import { enforceBroadcastRoleGate } from '../lib/broadcast-role-gate';
import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { getPrimeMessageThreadRecord } from '../lib/prime-messaging-repositories';
import { sendPrimeReviewThread } from '../lib/prime-review-send';
import { isWholeHostelBroadcastThread } from '../lib/prime-whole-hostel-campaigns';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env extends FirebaseEnv {
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
  const { uid: actorUid, roles } = claimsResult;

  const threadId = new URL(request.url).searchParams.get('threadId')?.trim() ?? '';
  if (!threadId) {
    return errorResponse('threadId is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const db = getPrimeMessagingDb(env);

  // Load thread record to determine whether this is a broadcast or DM send.
  // The role gate is conditional on thread type: broadcast requires owner|admin; DM sends
  // are unrestricted. sendPrimeReviewThread also loads the thread internally — this is an
  // accepted double DB read to avoid coupling the role-gate check into the send helper.
  const threadRecord = await getPrimeMessageThreadRecord(db, threadId);
  if (!threadRecord) {
    return errorResponse(`Prime review thread ${threadId} not found`, 404);
  }

  if (isWholeHostelBroadcastThread(threadRecord.thread)) {
    const roleGate = enforceBroadcastRoleGate(roles, actorUid);
    if (roleGate) {
      return roleGate;
    }
  }

  try {
    const result = await sendPrimeReviewThread(db, env, {
      threadId,
      actorUid,
      actorSource: 'reception_staff',
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

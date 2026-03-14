import type { D1Database } from '@acme/platform-core/d1';

import { WHOLE_HOSTEL_BROADCAST_CHANNEL_ID } from '../../src/lib/chat/directMessageChannel';
import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { upsertPrimeMessageThread } from '../lib/prime-messaging-repositories';
import { savePrimeReviewDraft } from '../lib/prime-review-drafts';
import { sendPrimeReviewThread } from '../lib/prime-review-send';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

/**
 * Firebase RTDB delivery model:
 * Messages written by `sendPrimeReviewThread` are projected to Firebase RTDB
 * (via `projectPrimeThreadMessageToFirebase`) under the broadcast channel node.
 * Guest devices receive new messages via RTDB subscription (real-time listener),
 * not via push notifications. Guests who have the app open see the message
 * immediately; guests with the app closed see it on next app open.
 * No additional delivery confirmation or acknowledgement is recorded.
 */

interface Env extends FirebaseEnv {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

interface StaffBroadcastSendRequestBody {
  plainText?: string;
}

/**
 * POST /api/staff-broadcast-send
 *
 * Single-hop endpoint for staff whole-hostel broadcasts.
 * Combines thread upsert (cold-DB guard), draft save, and send in one Cloudflare Pages Function.
 * Replaces the prior two-call chain of staff-initiate-thread + review-thread-send from Reception.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  let body: StaffBroadcastSendRequestBody;
  try {
    body = await request.json() as StaffBroadcastSendRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const plainText = body.plainText?.trim() ?? '';
  if (!plainText) {
    return errorResponse('plainText is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const actorUid = request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner';
  const db = getPrimeMessagingDb(env);

  try {
    // Cold-DB guard: upsert the singleton thread before draft save.
    // On a fresh DB, the thread does not yet exist; savePrimeReviewDraft would return
    // not_found without this. upsertPrimeMessageThread is idempotent (ON CONFLICT DO UPDATE).
    await upsertPrimeMessageThread(db, {
      id: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID,
      bookingId: '',
      channelType: 'broadcast',
      audience: 'whole_hostel',
    });

    const draftResult = await savePrimeReviewDraft(db, {
      threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID,
      actorUid,
      content: plainText,
    });

    // not_found after successful upsert is an internal invariant violation, not a client error
    if (draftResult.outcome === 'not_found') {
      return errorResponse('Broadcast thread unavailable after upsert', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    if (draftResult.outcome === 'conflict') {
      return errorResponse(draftResult.message, 409);
    }

    const sendResult = await sendPrimeReviewThread(db, env, {
      threadId: WHOLE_HOSTEL_BROADCAST_CHANNEL_ID,
      actorUid,
      actorSource: 'reception_staff_compose',
    });

    if (sendResult.outcome === 'not_found') {
      return errorResponse('Broadcast thread not found during send', 404); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    if (sendResult.outcome === 'conflict') {
      return errorResponse(sendResult.message, 409);
    }

    return jsonResponse({
      success: true,
      data: {
        outcome: 'sent',
        sentMessageId: sendResult.sentMessageId,
      },
    });
  } catch (error) {
    console.error('Failed to send staff broadcast:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to send staff broadcast', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
};

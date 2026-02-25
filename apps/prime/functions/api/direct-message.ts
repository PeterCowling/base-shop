/**
 * CF Pages Function: /api/direct-message
 *
 * Prime direct-message writes:
 * - validates guest session token from request header
 * - enforces same-booking membership for both guests
 * - enforces deterministic channel ID binding to sender/peer UUIDs
 * - enforces opt-in/block policy server-side
 * - writes channel metadata + message record
 */

import { buildDirectMessageChannelId } from '../../src/lib/chat/directMessageChannel';
import { canSendDirectMessage } from '../../src/lib/chat/messagingPolicy';
import type { GuestProfile } from '../../src/types/guestProfile';

import { FirebaseRest, errorResponse, jsonResponse } from '../lib/firebase-rest';
import { recordDirectTelemetry } from '../lib/direct-telemetry';
import { validateGuestSessionToken } from '../lib/guest-session';
import { enforceKvRateLimit } from '../lib/kv-rate-limit';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface DirectMessageRequestBody {
  bookingId?: string;
  peerUuid?: string;
  channelId?: string;
  content?: string;
}

interface BookingOccupantRecord {
  firstName?: string;
}

interface DirectChannelMeta {
  bookingId?: string;
  channelType?: string;
  memberUids?: Record<string, boolean>;
}

const MAX_MESSAGE_CONTENT_LENGTH = 1000;
const WRITE_RATE_LIMIT_MAX_REQUESTS = 40;
const WRITE_RATE_LIMIT_WINDOW_SECONDS = 60;

function buildMessageId(now: number): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `msg_${now}_${suffix}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: DirectMessageRequestBody;
  try {
    body = await request.json() as DirectMessageRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const token = request.headers.get('X-Prime-Guest-Token')?.trim() ?? '';
  const requestedBookingId = request.headers.get('X-Prime-Guest-Booking-Id')?.trim() ?? '';
  const bookingId = (body.bookingId ?? '').trim();
  const peerUuid = (body.peerUuid ?? '').trim();
  const channelId = (body.channelId ?? '').trim();
  const content = (body.content ?? '').trim();

  if (!token) {
    return errorResponse('X-Prime-Guest-Token header is required', 400);
  }
  if (!bookingId || !peerUuid || !channelId || !content) {
    return errorResponse('bookingId, peerUuid, channelId, and content are required', 400);
  }
  if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    return errorResponse(`content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`, 400);
  }

  const authResult = await validateGuestSessionToken(token, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const senderUuid = authResult.session.guestUuid;
  if (!senderUuid) {
    return errorResponse('guestUuid missing for session', 422);
  }

  const rateLimitResponse = await enforceKvRateLimit({
    kv: env.RATE_LIMIT,
    key: `direct-message:write:${senderUuid}`,
    maxRequests: WRITE_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: WRITE_RATE_LIMIT_WINDOW_SECONDS,
    errorMessage: 'Too many direct messages. Please wait before sending more.',
  });
  if (rateLimitResponse) {
    await recordDirectTelemetry(env, 'write.rate_limited');
    return rateLimitResponse;
  }

  if (requestedBookingId && requestedBookingId !== authResult.session.bookingId) {
    await recordDirectTelemetry(env, 'write.denied_booking_mismatch');
    return errorResponse('Booking mismatch for guest session', 403);
  }

  if (authResult.session.bookingId !== bookingId) {
    await recordDirectTelemetry(env, 'write.denied_booking_mismatch');
    return errorResponse('Booking mismatch for guest session', 403);
  }
  if (senderUuid === peerUuid) {
    return errorResponse('Cannot send direct message to the same guest UUID', 400);
  }

  const expectedChannelId = buildDirectMessageChannelId(senderUuid, peerUuid);
  if (channelId !== expectedChannelId) {
    await recordDirectTelemetry(env, 'write.denied_channel_mismatch');
    return errorResponse('Channel does not match sender/peer UUID pair', 403);
  }

  try {
    const firebase = new FirebaseRest(env);
    const [
      senderBooking,
      peerBooking,
      senderProfile,
      peerProfile,
      channelMeta,
    ] = await Promise.all([
      firebase.get<BookingOccupantRecord>(`bookings/${bookingId}/${senderUuid}`),
      firebase.get<BookingOccupantRecord>(`bookings/${bookingId}/${peerUuid}`),
      firebase.get<GuestProfile>(`guestProfiles/${senderUuid}`),
      firebase.get<GuestProfile>(`guestProfiles/${peerUuid}`),
      firebase.get<DirectChannelMeta>(`messaging/channels/${channelId}/meta`),
    ]);

    if (!senderBooking || !peerBooking) {
      await recordDirectTelemetry(env, 'write.denied_not_confirmed_guests');
      return errorResponse('Direct messaging is limited to confirmed guests on the same booking', 403);
    }

    if (!senderProfile || !peerProfile) {
      await recordDirectTelemetry(env, 'write.denied_not_confirmed_guests');
      return errorResponse('Direct messaging profiles are unavailable for this guest pair', 403);
    }

    if (senderProfile.bookingId !== bookingId || peerProfile.bookingId !== bookingId) {
      await recordDirectTelemetry(env, 'write.denied_not_confirmed_guests');
      return errorResponse('Direct messaging is limited to confirmed guests on the same booking', 403);
    }

    if (!canSendDirectMessage(senderProfile, senderUuid, peerProfile, peerUuid)) {
      await recordDirectTelemetry(env, 'write.denied_policy');
      return errorResponse('Direct messaging policy does not allow this conversation', 403);
    }

    const now = Date.now();
    if (!channelMeta) {
      await firebase.set(`messaging/channels/${channelId}/meta`, {
        channelType: 'direct',
        bookingId,
        memberUids: {
          [senderUuid]: true,
          [peerUuid]: true,
        },
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const existingMembers = channelMeta.memberUids ?? {};
      if (
        channelMeta.channelType !== 'direct'
        || channelMeta.bookingId !== bookingId
        || existingMembers[senderUuid] !== true
        || existingMembers[peerUuid] !== true
      ) {
        await recordDirectTelemetry(env, 'write.denied_channel_meta_conflict');
        return errorResponse('Direct channel metadata failed validation', 409);
      }

      await firebase.update(`messaging/channels/${channelId}/meta`, { updatedAt: now });
    }

    const messageId = buildMessageId(now);
    await firebase.set(`messaging/channels/${channelId}/messages/${messageId}`, {
      content,
      senderId: senderUuid,
      senderRole: 'guest',
      senderName: senderBooking.firstName?.trim() || undefined,
      createdAt: now,
    });

    await recordDirectTelemetry(env, 'write.success');
    return jsonResponse({
      success: true,
      messageId,
      createdAt: now,
    });
  } catch (error) {
    await recordDirectTelemetry(env, 'write.error');
    console.error('Failed to send direct message:', error);
    return errorResponse('Failed to send direct message', 500);
  }
};

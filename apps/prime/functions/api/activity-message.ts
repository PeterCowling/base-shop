/**
 * CF Pages Function: /api/activity-message
 *
 * Prime activity-message writes:
 * - validates guest session token from request header
 * - enforces rate limit per sender UUID
 * - writes channel metadata + message record to Firebase
 * - shadow-writes to D1 (fire-and-forget; failure does not surface to guest)
 *
 * Activity channels are hostel-wide group chats. No per-booking membership
 * check is required — any authenticated guest with a valid session may send.
 */

import { recordDirectTelemetry } from '../lib/direct-telemetry';
import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { validateGuestSessionToken } from '../lib/guest-session';
import { enforceKvRateLimit } from '../lib/kv-rate-limit';
import type { PrimeMessagingEnv } from '../lib/prime-messaging-db';
import { shadowWritePrimeInboundActivityMessage } from '../lib/prime-messaging-shadow-write';

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key.trim() === name) {
      return rest.join('=').trim() || null;
    }
  }
  return null;
}

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface ActivityMessageRequestBody {
  activityId?: string;
  channelId?: string;
  content?: string;
}

type ActivityChannelMeta = {
  channelType?: string;
  bookingId?: string;
  audience?: string;
  createdAt?: number;
};

const MAX_MESSAGE_CONTENT_LENGTH = 1000;
const WRITE_RATE_LIMIT_MAX_REQUESTS = 40;
const WRITE_RATE_LIMIT_WINDOW_SECONDS = 60;

function buildMessageId(now: number): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `msg_${now}_${suffix}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: ActivityMessageRequestBody;
  try {
    body = await request.json() as ActivityMessageRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const token = parseCookie(request.headers.get('Cookie') ?? '', 'prime_session')
    ?? request.headers.get('X-Prime-Guest-Token')?.trim()
    ?? '';
  const activityId = (body.activityId ?? '').trim();
  const channelId = (body.channelId ?? '').trim();
  const content = (body.content ?? '').trim();

  if (!token) {
    return errorResponse('Unauthorized', 401); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (!activityId || !channelId || !content) {
    return errorResponse('activityId, channelId, and content are required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    return errorResponse(`content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`, 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  // Activity channels use activityId as the channelId; enforce server-side.
  if (channelId !== activityId) {
    return errorResponse('channelId must match activityId for activity channels', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const authResult = await validateGuestSessionToken(token, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const senderUuid = authResult.session.guestUuid;
  if (!senderUuid) {
    return errorResponse('guestUuid missing for session', 422); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const rateLimitResponse = await enforceKvRateLimit({
    kv: env.RATE_LIMIT,
    key: `activity-message:write:${senderUuid}`,
    maxRequests: WRITE_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: WRITE_RATE_LIMIT_WINDOW_SECONDS,
    errorMessage: 'Too many activity messages. Please wait before sending more.', // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  });
  if (rateLimitResponse) {
    await recordDirectTelemetry(env, 'activity.write.rate_limited');
    return rateLimitResponse;
  }

  try {
    const firebase = new FirebaseRest(env);
    // Fetch channel meta; senderProfile is not fetched since GuestProfile does not
    // carry a display name field — senderName is omitted for activity messages.
    const channelMeta = await firebase.get<ActivityChannelMeta>(`messaging/channels/${channelId}/meta`);

    const now = Date.now();
    if (!channelMeta) {
      await firebase.set(`messaging/channels/${channelId}/meta`, {
        channelType: 'activity',
        bookingId: 'activity',
        audience: 'whole_hostel',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      if (channelMeta.channelType !== 'activity') {
        await recordDirectTelemetry(env, 'activity.write.error');
        return errorResponse('Activity channel metadata failed validation', 409); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      }
      await firebase.update(`messaging/channels/${channelId}/meta`, { updatedAt: now });
    }

    const messageId = buildMessageId(now);
    await firebase.set(`messaging/channels/${channelId}/messages/${messageId}`, {
      content,
      senderId: senderUuid,
      senderRole: 'guest',
      senderName: undefined,
      createdAt: now,
      kind: 'support',
      audience: 'whole_hostel',
    });

    try {
      await shadowWritePrimeInboundActivityMessage(env as PrimeMessagingEnv, {
        threadId: channelId,
        activityId,
        senderId: senderUuid,
        senderName: null,
        content,
        messageId,
        createdAt: now,
      });
    } catch (shadowWriteError) {
      console.error('Failed to shadow-write Prime activity message to D1:', { // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
        threadId: channelId,
        channelId,
        error: shadowWriteError instanceof Error ? shadowWriteError.message : String(shadowWriteError),
        failedAt: Date.now(),
      });
    }

    await recordDirectTelemetry(env, 'activity.write.success');
    return jsonResponse({
      success: true,
      messageId,
      createdAt: now,
    });
  } catch (error) {
    await recordDirectTelemetry(env, 'activity.write.error');
    console.error('Failed to send activity message:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to send activity message', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
};

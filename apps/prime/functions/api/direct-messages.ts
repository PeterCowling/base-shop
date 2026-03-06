/**
 * CF Pages Function: /api/direct-messages
 *
 * Prime direct-message reads:
 * - validates guest session token
 * - enforces direct-channel membership + booking alignment
 * - returns message list for authorized direct channels
 */

import type { Message } from '../../src/types/messenger/chat';
import { recordDirectTelemetry } from '../lib/direct-telemetry';
import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { validateGuestSessionToken } from '../lib/guest-session';
import { enforceKvRateLimit } from '../lib/kv-rate-limit';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface DirectChannelMeta {
  bookingId?: string;
  channelType?: string;
  memberUids?: Record<string, boolean>;
}

interface DirectMessagesResponse {
  messages: Message[];
}

const DEFAULT_MESSAGES_LIMIT = 50;
const MAX_MESSAGES_LIMIT = 200;
const READ_RATE_LIMIT_MAX_REQUESTS = 180;
const READ_RATE_LIMIT_WINDOW_SECONDS = 60;

function parseLimit(rawLimit: string | null): number | null {
  if (!rawLimit) {
    return DEFAULT_MESSAGES_LIMIT;
  }

  const limit = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(limit) || limit < 1 || limit > MAX_MESSAGES_LIMIT) {
    return null;
  }

  return limit;
}

function parseBefore(rawBefore: string | null): number | null {
  if (!rawBefore) {
    return null;
  }

  const before = Number.parseInt(rawBefore, 10);
  if (!Number.isFinite(before) || before < 0) {
    return null;
  }

  return before;
}

function normalizeMessageRecord(
  id: string,
  raw: unknown,
): Message | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const value = raw as Partial<Message>;
  if (
    typeof value.content !== 'string'
    || typeof value.senderId !== 'string'
    || typeof value.senderRole !== 'string'
    || typeof value.createdAt !== 'number'
  ) {
    return null;
  }

  return {
    id,
    content: value.content,
    senderId: value.senderId,
    senderRole: value.senderRole,
    senderName: typeof value.senderName === 'string' ? value.senderName : undefined,
    createdAt: value.createdAt,
    deleted: typeof value.deleted === 'boolean' ? value.deleted : undefined,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : undefined,
  };
}

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key.trim() === name) {
      return rest.join('=').trim() || null;
    }
  }
  return null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const channelId = url.searchParams.get('channelId')?.trim() ?? '';
  const rawLimit = url.searchParams.get('limit');
  const rawBefore = url.searchParams.get('before');
  const token = parseCookie(request.headers.get('Cookie') ?? '', 'prime_session')
    ?? request.headers.get('X-Prime-Guest-Token')?.trim()
    ?? '';
  const requestedBookingId = request.headers.get('X-Prime-Guest-Booking-Id')?.trim() ?? '';
  const limit = parseLimit(rawLimit);
  const before = parseBefore(rawBefore);

  if (!channelId) {
    return errorResponse('channelId parameter is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (limit === null) {
    return errorResponse(`limit must be an integer between 1 and ${MAX_MESSAGES_LIMIT}`, 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (rawBefore && before === null) {
    return errorResponse('before must be a non-negative integer timestamp', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (!token) {
    return errorResponse('Unauthorized', 401); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const authResult = await validateGuestSessionToken(token, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const sessionBookingId = authResult.session.bookingId;
  const sessionGuestUuid = authResult.session.guestUuid;

  if (!sessionBookingId || !sessionGuestUuid) {
    return errorResponse('guestUuid missing for session', 422); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const rateLimitResponse = await enforceKvRateLimit({
    kv: env.RATE_LIMIT,
    key: `direct-message:read:${sessionGuestUuid}`,
    maxRequests: READ_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: READ_RATE_LIMIT_WINDOW_SECONDS,
    errorMessage: 'Too many direct-message reads. Please wait before retrying.',
  });
  if (rateLimitResponse) {
    await recordDirectTelemetry(env, 'read.rate_limited');
    return rateLimitResponse;
  }

  if (requestedBookingId && requestedBookingId !== sessionBookingId) {
    await recordDirectTelemetry(env, 'read.denied_booking_mismatch');
    return errorResponse('Booking mismatch for guest session', 403); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    const firebase = new FirebaseRest(env);

    const channelMeta = await firebase.get<DirectChannelMeta>(
      `messaging/channels/${channelId}/meta`,
    );

    if (!channelMeta) {
      return jsonResponse<DirectMessagesResponse>({ messages: [] });
    }

    const members = channelMeta.memberUids ?? {};
    if (
      channelMeta.channelType !== 'direct'
      || channelMeta.bookingId !== sessionBookingId
      || members[sessionGuestUuid] !== true
    ) {
      await recordDirectTelemetry(env, 'read.denied_membership');
      return errorResponse('Direct channel access denied for this guest session', 403); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const rawMessages = await firebase.get<Record<string, unknown>>(
      `messaging/channels/${channelId}/messages`,
    );

    if (!rawMessages) {
      return jsonResponse<DirectMessagesResponse>({ messages: [] });
    }

    const allMessages = Object.entries(rawMessages)
      .map(([id, record]) => normalizeMessageRecord(id, record))
      .filter((record): record is Message => record !== null)
      .sort((left, right) => left.createdAt - right.createdAt);

    const filteredMessages = before === null
      ? allMessages
      : allMessages.filter((message) => message.createdAt < before);

    const messages = filteredMessages.slice(-limit);

    await recordDirectTelemetry(env, 'read.success');
    return jsonResponse<DirectMessagesResponse>({ messages });
  } catch (error) {
    await recordDirectTelemetry(env, 'read.error');
    console.error('Failed to read direct messages:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to read direct messages', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
};

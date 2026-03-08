import type { MessageAudience } from '../../src/types/messenger/chat';

import {
  getPrimeMessagingDb,
  hasPrimeMessagingDb,
  type PrimeMessagingEnv,
} from './prime-messaging-db';
import {
  createPrimeMessage,
  enqueuePrimeProjectionJob,
  getPrimeMessageThread,
  type PrimeMessageAdmissionDecision,
  type PrimeMessageThreadRow,
  type PrimeReviewStatus,
  recordPrimeMessageAdmission,
  upsertPrimeMessageThread,
} from './prime-messaging-repositories';

export interface ShadowWritePrimeInboundDirectMessageInput {
  threadId: string;
  bookingId: string;
  senderId: string;
  senderName?: string | null;
  peerId: string;
  content: string;
  messageId: string;
  createdAt: number;
  audience?: MessageAudience;
}

export interface ShadowWritePrimeInboundDirectMessageResult {
  persisted: boolean;
  admissionDecision: PrimeMessageAdmissionDecision | null;
}

function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function buildThreadMetadata(
  existingThread: PrimeMessageThreadRow | null,
  input: ShadowWritePrimeInboundDirectMessageInput,
): Record<string, unknown> {
  const existingMetadata = parseJsonObject(existingThread?.metadata_json ?? null) ?? {};

  return {
    ...existingMetadata,
    shadowWriteTransport: 'firebase',
    directChannelId: input.threadId,
    lastSenderId: input.senderId,
    lastPeerId: input.peerId,
  };
}

function resolveAdmissionDecision(
  existingThread: PrimeMessageThreadRow | null,
): { decision: PrimeMessageAdmissionDecision; reason: string | null } {
  if (existingThread?.takeover_state === 'staff_active') {
    return {
      decision: 'manual_takeover',
      reason: existingThread.suppression_reason ?? 'staff_active',
    };
  }

  if (existingThread?.takeover_state === 'suppressed') {
    return {
      decision: 'suppressed',
      reason: existingThread.suppression_reason ?? 'suppressed',
    };
  }

  return {
    decision: 'queued',
    reason: null,
  };
}

function resolveReviewStatus(
  admissionDecision: PrimeMessageAdmissionDecision,
): PrimeReviewStatus {
  if (admissionDecision === 'manual_takeover' || admissionDecision === 'suppressed') {
    return 'review_later';
  }

  return 'pending';
}

export async function shadowWritePrimeInboundDirectMessage(
  env: PrimeMessagingEnv,
  input: ShadowWritePrimeInboundDirectMessageInput,
): Promise<ShadowWritePrimeInboundDirectMessageResult> {
  if (!hasPrimeMessagingDb(env)) {
    return {
      persisted: false,
      admissionDecision: null,
    };
  }

  const db = getPrimeMessagingDb(env);
  const existingThread = await getPrimeMessageThread(db, input.threadId);
  const admission = resolveAdmissionDecision(existingThread);

  await upsertPrimeMessageThread(db, {
    id: input.threadId,
    bookingId: input.bookingId,
    channelType: existingThread?.channel_type ?? 'direct',
    audience: input.audience ?? existingThread?.audience ?? 'thread',
    memberUids: [input.senderId, input.peerId],
    title: existingThread?.title ?? null,
    latestMessageAt: input.createdAt,
    latestInboundMessageAt: input.createdAt,
    lastStaffReplyAt: existingThread?.last_staff_reply_at ?? null,
    takeoverState: existingThread?.takeover_state ?? 'automated',
    reviewStatus: resolveReviewStatus(admission.decision),
    suppressionReason: existingThread?.suppression_reason ?? null,
    metadata: buildThreadMetadata(existingThread, input),
    createdAt: existingThread?.created_at ?? input.createdAt,
    updatedAt: input.createdAt,
  });

  await createPrimeMessage(db, {
    id: input.messageId,
    threadId: input.threadId,
    senderId: input.senderId,
    senderRole: 'guest',
    senderName: input.senderName ?? null,
    content: input.content,
    kind: 'support',
    audience: input.audience ?? 'thread',
    createdAt: input.createdAt,
  });

  await recordPrimeMessageAdmission(db, {
    threadId: input.threadId,
    decision: admission.decision,
    reason: admission.reason,
    source: 'guest_direct_message',
    sourceMetadata: {
      messageId: input.messageId,
      threadId: input.threadId,
      bookingId: input.bookingId,
      senderId: input.senderId,
      peerId: input.peerId,
      transport: 'firebase_shadow_write',
    },
    createdAt: input.createdAt,
  });

  await enqueuePrimeProjectionJob(db, {
    id: `proj_message_${input.messageId}`,
    threadId: input.threadId,
    entityType: 'message',
    entityId: input.messageId,
    createdAt: input.createdAt,
  });

  return {
    persisted: true,
    admissionDecision: admission.decision,
  };
}

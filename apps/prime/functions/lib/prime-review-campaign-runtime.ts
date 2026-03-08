import type { D1Database } from '@acme/platform-core/d1';

import { buildBroadcastChannelId } from '../../src/lib/chat/directMessageChannel';

import type { FirebaseEnv } from './firebase-rest';
import { FirebaseRest } from './firebase-rest';
import {
  createPrimeMessage,
  enqueuePrimeProjectionJob,
  type PrimeMessageCampaignRow,
  type PrimeMessageDraftRow,
  type PrimeMessageThreadRecord,
  type PrimeMessageThreadRow,
  recordPrimeMessageAdmission,
  updatePrimeMessageCampaign,
  updatePrimeMessageCampaignDelivery,
  updatePrimeMessageDraft,
  updatePrimeProjectionJob,
  upsertPrimeMessageCampaignDelivery,
  upsertPrimeMessageCampaignTargetSnapshot,
  upsertPrimeMessageThread,
} from './prime-messaging-repositories';
import { getPrimeReviewCampaignDetail, type PrimeReviewCampaignDetail } from './prime-review-campaigns';
import {
  buildReviewMessageId,
  buildThreadSendConflictMessage,
  getCurrentReviewDraft,
  parseAttachments,
  parseCards,
  parseJsonObject,
  parseLinks,
  parseStringArray,
  resolveSentAdmissionReason,
  resolveSentMessageKind,
} from './prime-review-send-support';
import { projectPrimeThreadMessageToFirebase } from './prime-thread-projection';

type BookingOccupantRecord = {
  checkInDate?: string;
  checkOutDate?: string;
  roomNumbers?: string[];
  room?: string;
  firstName?: string;
  lastName?: string;
};

type GuestByRoomRecord = {
  allocated?: string;
  booked?: string;
};

type ExpandedCampaignTarget = {
  snapshotId: string;
  targetKind: 'booking' | 'room';
  targetKey: string;
  bookingId: string;
  roomKey: string | null;
  threadId: string;
  memberUids: string[];
  matchedOccupantUids: string[];
  eligibilityContext: Record<string, unknown>;
  targetMetadata: Record<string, unknown>;
};

export type SendPrimeExpandedCampaignResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | { outcome: 'sent'; campaign: PrimeReviewCampaignDetail; sentMessageId: string };

function getTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function compareIsoDates(left: string, right: string): number {
  return left.localeCompare(right);
}

function parseCampaignMetadata(campaign: PrimeMessageCampaignRow): Record<string, unknown> {
  return parseJsonObject(campaign.metadata_json) ?? {};
}

function resolveBookingIdFromMetadata(
  metadata: Record<string, unknown>,
  sourceThread: PrimeMessageThreadRow,
): string | null {
  const nestedTargeting = metadata.targeting;
  if (nestedTargeting && typeof nestedTargeting === 'object' && !Array.isArray(nestedTargeting)) {
    const bookingId = (nestedTargeting as Record<string, unknown>).bookingId;
    if (typeof bookingId === 'string' && bookingId.trim()) {
      return bookingId.trim();
    }
  }

  for (const key of ['bookingId', 'targetBookingId']) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return sourceThread.booking_id.trim() || null;
}

function resolveRoomKeyFromMetadata(metadata: Record<string, unknown>): string | null {
  const nestedTargeting = metadata.targeting;
  if (nestedTargeting && typeof nestedTargeting === 'object' && !Array.isArray(nestedTargeting)) {
    const roomKey = (nestedTargeting as Record<string, unknown>).roomKey;
    if (typeof roomKey === 'string' && roomKey.trim()) {
      return roomKey.trim();
    }
  }

  for (const key of ['roomKey', 'room', 'roomNumber']) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function isOccupantActiveToday(occupant: BookingOccupantRecord, todayIso: string): boolean {
  if (!occupant.checkInDate || !occupant.checkOutDate) {
    return false;
  }

  return compareIsoDates(occupant.checkInDate, todayIso) <= 0
    && compareIsoDates(occupant.checkOutDate, todayIso) >= 0;
}

function occupantMatchesRoom(
  occupantId: string,
  occupant: BookingOccupantRecord,
  guestByRoom: Record<string, GuestByRoomRecord> | null,
  roomKey: string,
): boolean {
  const allocatedRoom = guestByRoom?.[occupantId]?.allocated?.trim();
  if (allocatedRoom && allocatedRoom === roomKey) {
    return true;
  }

  if (typeof occupant.room === 'string' && occupant.room.trim() === roomKey) {
    return true;
  }

  return occupant.roomNumbers?.some((entry) => String(entry).trim() === roomKey) ?? false;
}

function buildTargetThreadTitle(bookingId: string): string {
  return `Prime booking ${bookingId}`;
}

function buildProjectionJobId(messageId: string): string {
  return `proj_message_${messageId}`;
}

async function loadBookings(firebase: FirebaseRest): Promise<Record<string, Record<string, BookingOccupantRecord>>> {
  return await firebase.get<Record<string, Record<string, BookingOccupantRecord>>>('bookings') ?? {};
}

async function loadGuestByRoom(firebase: FirebaseRest): Promise<Record<string, GuestByRoomRecord> | null> {
  return await firebase.get<Record<string, GuestByRoomRecord>>('guestByRoom');
}

async function expandCampaignTargets(
  env: FirebaseEnv,
  campaign: PrimeMessageCampaignRow,
  sourceThread: PrimeMessageThreadRow,
): Promise<ExpandedCampaignTarget[] | { conflict: string }> {
  const metadata = parseCampaignMetadata(campaign);
  const firebase = new FirebaseRest(env);

  if (campaign.audience === 'booking') {
    const bookingId = resolveBookingIdFromMetadata(metadata, sourceThread);
    if (!bookingId) {
      return { conflict: 'Prime booking campaign metadata is missing bookingId' }; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const booking = await firebase.get<Record<string, BookingOccupantRecord>>(`bookings/${bookingId}`);
    if (!booking) {
      return { conflict: `Prime booking campaign target ${bookingId} was not found` }; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const memberUids = Object.keys(booking).filter((key) => key.startsWith('occ_'));
    return [{
      snapshotId: `${campaign.id}_target_booking_${bookingId}`,
      targetKind: 'booking',
      targetKey: bookingId,
      bookingId,
      roomKey: null,
      threadId: buildBroadcastChannelId(`booking_${bookingId}`),
      memberUids,
      matchedOccupantUids: memberUids,
      eligibilityContext: {
        sourceAudience: campaign.audience,
        sourceThreadId: sourceThread.id,
      },
      targetMetadata: {
        sourceAudience: campaign.audience,
        bookingId,
        deliveryModel: 'booking_broadcast_thread',
      },
    }];
  }

  if (campaign.audience === 'room') {
    const roomKey = resolveRoomKeyFromMetadata(metadata);
    if (!roomKey) {
      return { conflict: 'Prime room campaign metadata is missing roomKey' }; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const [bookings, guestByRoom] = await Promise.all([
      loadBookings(firebase),
      loadGuestByRoom(firebase),
    ]);
    const todayIso = getTodayIso();
    const targets: ExpandedCampaignTarget[] = [];

    for (const [bookingId, occupants] of Object.entries(bookings)) {
      const occupantEntries = Object.entries(occupants)
        .filter(([occupantId]) => occupantId.startsWith('occ_'));
      const matchedOccupantUids = occupantEntries
        .filter(([occupantId, occupant]) =>
          isOccupantActiveToday(occupant, todayIso)
          && occupantMatchesRoom(occupantId, occupant, guestByRoom, roomKey),
        )
        .map(([occupantId]) => occupantId);

      if (matchedOccupantUids.length === 0) {
        continue;
      }

      const memberUids = occupantEntries.map(([occupantId]) => occupantId);
      targets.push({
        snapshotId: `${campaign.id}_target_room_${roomKey}_${bookingId}`,
        targetKind: 'room',
        targetKey: `${roomKey}:${bookingId}`,
        bookingId,
        roomKey,
        threadId: buildBroadcastChannelId(`booking_${bookingId}`),
        memberUids,
        matchedOccupantUids,
        eligibilityContext: {
          sourceAudience: campaign.audience,
          roomKey,
          matchedOccupantUids,
          sourceThreadId: sourceThread.id,
        },
        targetMetadata: {
          sourceAudience: campaign.audience,
          bookingId,
          roomKey,
          deliveryModel: 'booking_broadcast_thread_from_room_lens',
        },
      });
    }

    if (targets.length === 0) {
      return { conflict: `Prime room campaign room ${roomKey} has no active booking targets` }; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    return targets;
  }

  return { conflict: `Prime campaign audience ${campaign.audience} is not supported by expansion send` }; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
}

function computeCampaignCountersFromTargets(
  results: Array<{ status: 'projected' | 'failed'; lastError: string | null }>,
) {
  let sentCount = 0;
  let projectedCount = 0;
  let failedCount = 0;
  let lastError: string | null = null;

  for (const result of results) {
    sentCount += 1;
    if (result.status === 'projected') {
      projectedCount += 1;
    } else {
      failedCount += 1;
      lastError ??= result.lastError;
    }
  }

  return {
    targetCount: results.length,
    sentCount,
    projectedCount,
    failedCount,
    lastError,
  };
}

async function projectTargetDelivery(
  db: D1Database,
  env: FirebaseEnv,
  input: {
    campaign: PrimeMessageCampaignRow;
    sourceThread: PrimeMessageThreadRow;
    sourceDraft: PrimeMessageDraftRow;
    sourceMessageId: string;
    actorUid: string;
    occurredAt: number;
    target: ExpandedCampaignTarget;
  },
): Promise<{ status: 'projected' | 'failed'; lastError: string | null; messageId: string }> {
  const reusesSourceThread = input.target.threadId === input.sourceThread.id;
  const messageId = reusesSourceThread ? input.sourceMessageId : buildReviewMessageId(input.occurredAt);

  const targetThread = await upsertPrimeMessageThread(db, {
    id: input.target.threadId,
    bookingId: input.target.bookingId,
    channelType: 'broadcast',
    audience: 'booking',
    memberUids: input.target.memberUids,
    title: buildTargetThreadTitle(input.target.bookingId),
    latestMessageAt: input.occurredAt,
    lastStaffReplyAt: input.occurredAt,
    takeoverState: 'staff_active',
    reviewStatus: 'sent',
    metadata: {
      channelScope: 'booking_broadcast',
      bookingId: input.target.bookingId,
    },
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });

  const snapshot = await upsertPrimeMessageCampaignTargetSnapshot(db, {
    id: input.target.snapshotId,
    campaignId: input.campaign.id,
    targetKind: input.target.targetKind,
    targetKey: input.target.targetKey,
    threadId: targetThread.id,
    bookingId: input.target.bookingId,
    roomKey: input.target.roomKey,
    targetMetadata: input.target.targetMetadata,
    eligibilityContext: input.target.eligibilityContext,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });

  if (!reusesSourceThread) {
    await createPrimeMessage(db, {
      id: messageId,
      threadId: targetThread.id,
      senderId: input.actorUid,
      senderRole: 'staff',
      senderName: 'Reception',
      content: input.sourceDraft.content,
      kind: 'promotion',
      audience: input.campaign.audience,
      links: parseLinks(input.sourceDraft.links_json),
      attachments: parseAttachments(input.sourceDraft.attachments_json),
      cards: parseCards(input.sourceDraft.cards_json),
      campaignId: input.campaign.id,
      draftId: input.sourceDraft.id,
      createdAt: input.occurredAt,
    });
  }

  const projectionJobId = buildProjectionJobId(messageId);
  await enqueuePrimeProjectionJob(db, {
    id: projectionJobId,
    threadId: targetThread.id,
    entityType: 'message',
    entityId: messageId,
    status: 'pending',
    attemptCount: 0,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });

  await upsertPrimeMessageCampaignDelivery(db, {
    id: `${input.campaign.id}_delivery_${snapshot.id}`,
    campaignId: input.campaign.id,
    targetSnapshotId: snapshot.id,
    deliveryStatus: 'sent',
    threadId: targetThread.id,
    draftId: input.sourceDraft.id,
    messageId,
    projectionJobId,
    attemptCount: 0,
    sentAt: input.occurredAt,
    deliveryMetadata: {
      sourceThreadId: input.sourceThread.id,
      sourceAudience: input.campaign.audience,
      matchedOccupantUids: input.target.matchedOccupantUids,
    },
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });

  try {
    const message = {
      id: messageId,
      thread_id: targetThread.id,
      sender_id: input.actorUid,
      sender_role: 'staff' as const,
      sender_name: 'Reception',
      content: input.sourceDraft.content,
      kind: 'promotion' as const,
      audience: input.campaign.audience,
      links_json: JSON.stringify(parseLinks(input.sourceDraft.links_json) ?? null),
      attachments_json: JSON.stringify(parseAttachments(input.sourceDraft.attachments_json) ?? null),
      cards_json: JSON.stringify(parseCards(input.sourceDraft.cards_json) ?? null),
      campaign_id: input.campaign.id,
      draft_id: input.sourceDraft.id,
      deleted: 0,
      created_at: input.occurredAt,
    };

    await projectPrimeThreadMessageToFirebase(env, {
      thread: targetThread,
      message,
      draft: input.sourceDraft,
      occurredAt: input.occurredAt,
    });

    await updatePrimeProjectionJob(db, {
      jobId: projectionJobId,
      status: 'projected',
      attemptCount: 1,
      lastAttemptAt: input.occurredAt,
      lastError: null,
      updatedAt: input.occurredAt,
    });
    await updatePrimeMessageCampaignDelivery(db, {
      deliveryId: `${input.campaign.id}_delivery_${snapshot.id}`,
      deliveryStatus: 'projected',
      threadId: targetThread.id,
      draftId: input.sourceDraft.id,
      messageId,
      projectionJobId,
      attemptCount: 1,
      lastAttemptAt: input.occurredAt,
      lastError: null,
      sentAt: input.occurredAt,
      projectedAt: input.occurredAt,
      deliveryMetadata: {
        sourceThreadId: input.sourceThread.id,
        sourceAudience: input.campaign.audience,
        matchedOccupantUids: input.target.matchedOccupantUids,
      },
      updatedAt: input.occurredAt,
    });

    return {
      status: 'projected',
      lastError: null,
      messageId,
    };
  } catch (error) {
    const lastError = error instanceof Error ? error.message : String(error);

    await updatePrimeProjectionJob(db, {
      jobId: projectionJobId,
      status: 'failed',
      attemptCount: 1,
      lastAttemptAt: input.occurredAt,
      lastError,
      updatedAt: input.occurredAt,
    });
    await updatePrimeMessageCampaignDelivery(db, {
      deliveryId: `${input.campaign.id}_delivery_${snapshot.id}`,
      deliveryStatus: 'failed',
      threadId: targetThread.id,
      draftId: input.sourceDraft.id,
      messageId,
      projectionJobId,
      attemptCount: 1,
      lastAttemptAt: input.occurredAt,
      lastError,
      sentAt: input.occurredAt,
      projectedAt: null,
      deliveryMetadata: {
        sourceThreadId: input.sourceThread.id,
        sourceAudience: input.campaign.audience,
        matchedOccupantUids: input.target.matchedOccupantUids,
      },
      updatedAt: input.occurredAt,
    });

    return {
      status: 'failed',
      lastError,
      messageId,
    };
  }
}

export async function sendPrimeExpandedCampaign(
  db: D1Database,
  env: FirebaseEnv,
  input: {
    threadRecord: PrimeMessageThreadRecord;
    campaign: PrimeMessageCampaignRow;
    actorUid: string;
    actorSource: string;
    occurredAt?: number;
  },
): Promise<SendPrimeExpandedCampaignResult> {
  const sourceThread = input.threadRecord.thread;
  const conflictMessage = buildThreadSendConflictMessage(sourceThread);
  if (conflictMessage) {
    return { outcome: 'conflict', message: conflictMessage };
  }

  const currentDraft = getCurrentReviewDraft(input.threadRecord.drafts);
  if (!currentDraft) {
    return { outcome: 'conflict', message: 'Prime review thread has no draft to send' }; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const occurredAt = input.occurredAt ?? Date.now();
  const expandedTargets = await expandCampaignTargets(env, input.campaign, sourceThread);
  if ('conflict' in expandedTargets) {
    return { outcome: 'conflict', message: expandedTargets.conflict };
  }

  const sourceMessageId = buildReviewMessageId(occurredAt);
  const links = parseLinks(currentDraft.links_json);
  const attachments = parseAttachments(currentDraft.attachments_json);
  const cards = parseCards(currentDraft.cards_json);

  await createPrimeMessage(db, {
    id: sourceMessageId,
    threadId: sourceThread.id,
    senderId: input.actorUid,
    senderRole: 'staff',
    senderName: 'Reception',
    content: currentDraft.content,
    kind: resolveSentMessageKind(sourceThread),
    audience: input.campaign.audience,
    links,
    attachments,
    cards,
    campaignId: input.campaign.id,
    draftId: currentDraft.id,
    createdAt: occurredAt,
  });

  const sentDraft = await updatePrimeMessageDraft(db, {
    draftId: currentDraft.id,
    status: 'sent',
    content: currentDraft.content,
    kind: currentDraft.kind,
    audience: currentDraft.audience,
    links,
    attachments,
    cards,
    quality: parseJsonObject(currentDraft.quality_json),
    interpret: parseJsonObject(currentDraft.interpret_json),
    createdByUid: currentDraft.created_by_uid,
    reviewerUid: input.actorUid,
    suppressionReason: currentDraft.suppression_reason,
    sentMessageId: sourceMessageId,
    updatedAt: occurredAt,
  });
  if (!sentDraft) {
    return { outcome: 'not_found' };
  }

  await upsertPrimeMessageThread(db, {
    id: sourceThread.id,
    bookingId: sourceThread.booking_id,
    channelType: sourceThread.channel_type,
    audience: sourceThread.audience,
    memberUids: parseStringArray(sourceThread.member_uids_json),
    title: sourceThread.title,
    latestMessageAt: occurredAt,
    latestInboundMessageAt: sourceThread.latest_inbound_message_at,
    lastStaffReplyAt: occurredAt,
    takeoverState: 'staff_active',
    reviewStatus: 'sent',
    suppressionReason: sourceThread.suppression_reason,
    metadata: parseJsonObject(sourceThread.metadata_json),
    createdAt: sourceThread.created_at,
    updatedAt: occurredAt,
  });

  await recordPrimeMessageAdmission(db, {
    threadId: sourceThread.id,
    draftId: currentDraft.id,
    decision: 'sent',
    reason: resolveSentAdmissionReason(sourceThread),
    source: 'staff_review',
    sourceMetadata: {
      actorUid: input.actorUid,
      actorSource: input.actorSource,
      messageId: sourceMessageId,
      campaignId: input.campaign.id,
      projectionTarget: 'firebase',
    },
    createdAt: occurredAt,
  });

  const deliveryResults = await Promise.all(
    expandedTargets.map((target) =>
      projectTargetDelivery(db, env, {
        campaign: input.campaign,
        sourceThread,
        sourceDraft: sentDraft,
        sourceMessageId,
        actorUid: input.actorUid,
        occurredAt,
        target,
      })),
  );

  const counters = computeCampaignCountersFromTargets(deliveryResults);

  await updatePrimeMessageCampaign(db, {
    campaignId: input.campaign.id,
    status: 'sent',
    title: input.campaign.title,
    metadata: parseCampaignMetadata(input.campaign),
    latestDraftId: currentDraft.id,
    sentMessageId: sourceMessageId,
    targetCount: counters.targetCount,
    sentCount: counters.sentCount,
    projectedCount: counters.projectedCount,
    failedCount: counters.failedCount,
    lastError: counters.lastError,
    createdByUid: input.campaign.created_by_uid,
    reviewerUid: input.actorUid,
    updatedAt: occurredAt,
  });

  const campaign = await getPrimeReviewCampaignDetail(db, input.campaign.id);
  if (!campaign) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'sent',
    campaign,
    sentMessageId: sourceMessageId,
  };
}

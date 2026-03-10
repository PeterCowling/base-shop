import type { D1Database } from '@acme/platform-core/d1';

import type { MessageAudience } from '../../src/types/messenger/chat';

import type {
  PrimeMessageCampaignRow,
  PrimeMessageThreadRow,
} from './prime-messaging-repositories';
import {
  createPrimeMessageCampaign,
  getPrimeLatestMessageCampaignForThread,
  updatePrimeMessageCampaign,
  upsertPrimeMessageCampaignDelivery,
  upsertPrimeMessageCampaignTargetSnapshot,
} from './prime-messaging-repositories';

const WHOLE_HOSTEL_THREAD_ID = 'broadcast_whole_hostel';

export function buildWholeHostelCampaignId(now: number): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `camp_${now}_${suffix}`;
}

function buildDefaultCampaignTitle(
  thread: Pick<PrimeMessageThreadRow, 'title' | 'audience'>,
): string {
  if (thread.title?.trim()) {
    return thread.title.trim();
  }

  return thread.audience === 'whole_hostel'
    ? 'Whole-hostel broadcast'
    : 'Prime broadcast campaign';
}

function buildDefaultMetadata(audience: MessageAudience): Record<string, unknown> {
  return {
    deliveryModel: audience === 'whole_hostel'
      ? 'shared_whole_hostel_broadcast_thread'
      : 'shared_broadcast_thread',
    audience,
  };
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
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

function isTerminalCampaignStatus(status: PrimeMessageCampaignRow['status']): boolean {
  return status === 'sent' || status === 'resolved' || status === 'archived';
}

export function isWholeHostelBroadcastThread(
  thread: Pick<PrimeMessageThreadRow, 'id' | 'channel_type' | 'audience'>,
): boolean {
  return thread.id === WHOLE_HOSTEL_THREAD_ID
    && thread.channel_type === 'broadcast'
    && thread.audience === 'whole_hostel';
}

export async function getLatestWholeHostelCampaign(
  db: D1Database,
  threadId: string,
): Promise<PrimeMessageCampaignRow | null> {
  const campaign = await getPrimeLatestMessageCampaignForThread(db, threadId);
  return campaign?.audience === 'whole_hostel' ? campaign : null;
}

export async function ensureWholeHostelCampaignForDraft(
  db: D1Database,
  input: {
    thread: PrimeMessageThreadRow;
    draftId: string;
    actorUid: string;
    occurredAt: number;
  },
): Promise<PrimeMessageCampaignRow> {
  const existingCampaign = await getLatestWholeHostelCampaign(db, input.thread.id);
  if (existingCampaign && !isTerminalCampaignStatus(existingCampaign.status)) {
    const updatedCampaign = await updatePrimeMessageCampaign(db, {
      campaignId: existingCampaign.id,
      status: 'under_review',
      title: existingCampaign.title ?? buildDefaultCampaignTitle(input.thread),
      metadata: buildDefaultMetadata(input.thread.audience),
      latestDraftId: input.draftId,
      sentMessageId: existingCampaign.sent_message_id,
      createdByUid: existingCampaign.created_by_uid ?? input.actorUid,
      reviewerUid: input.actorUid,
      updatedAt: input.occurredAt,
    });

    if (!updatedCampaign) {
      throw new Error(`Prime whole-hostel campaign ${existingCampaign.id} disappeared during draft save`);
    }

    return updatedCampaign;
  }

  return createPrimeMessageCampaign(db, {
    id: buildWholeHostelCampaignId(input.occurredAt),
    threadId: input.thread.id,
    campaignType: 'broadcast',
    audience: input.thread.audience,
    status: 'under_review',
    title: buildDefaultCampaignTitle(input.thread),
    metadata: buildDefaultMetadata(input.thread.audience),
    latestDraftId: input.draftId,
    createdByUid: input.actorUid,
    reviewerUid: input.actorUid,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
}

export async function markWholeHostelCampaignSent(
  db: D1Database,
  input: {
    thread: PrimeMessageThreadRow;
    campaignId?: string | null;
    draftId: string;
    sentMessageId: string;
    actorUid: string;
    occurredAt: number;
  },
): Promise<PrimeMessageCampaignRow> {
  const existingCampaign = await getLatestWholeHostelCampaign(db, input.thread.id);
  if (existingCampaign) {
    const updatedCampaign = await updatePrimeMessageCampaign(db, {
      campaignId: existingCampaign.id,
      status: 'sent',
      title: existingCampaign.title ?? buildDefaultCampaignTitle(input.thread),
      metadata: buildDefaultMetadata(input.thread.audience),
      latestDraftId: input.draftId,
      sentMessageId: input.sentMessageId,
      createdByUid: existingCampaign.created_by_uid ?? input.actorUid,
      reviewerUid: input.actorUid,
      updatedAt: input.occurredAt,
    });

    if (!updatedCampaign) {
      throw new Error(`Prime whole-hostel campaign ${existingCampaign.id} disappeared during send`);
    }

    return updatedCampaign;
  }

  return createPrimeMessageCampaign(db, {
    id: input.campaignId ?? buildWholeHostelCampaignId(input.occurredAt),
    threadId: input.thread.id,
    campaignType: 'broadcast',
    audience: input.thread.audience,
    status: 'sent',
    title: buildDefaultCampaignTitle(input.thread),
    metadata: buildDefaultMetadata(input.thread.audience),
    latestDraftId: input.draftId,
    sentMessageId: input.sentMessageId,
    createdByUid: input.actorUid,
    reviewerUid: input.actorUid,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
}

export async function recordWholeHostelCampaignDelivery(
  db: D1Database,
  input: {
    campaignId: string;
    thread: PrimeMessageThreadRow;
    draftId: string;
    sentMessageId: string;
    projectionJobId: string;
    occurredAt: number;
  },
): Promise<void> {
  const existingCampaign = await getLatestWholeHostelCampaign(db, input.thread.id);
  if (!existingCampaign || existingCampaign.id !== input.campaignId) {
    throw new Error(`Prime whole-hostel campaign ${input.campaignId} not found during delivery sync`);
  }

  const targetSnapshotId = `${input.campaignId}_target_whole_hostel`;
  const deliveryId = `${input.campaignId}_delivery_whole_hostel`;

  await upsertPrimeMessageCampaignTargetSnapshot(db, {
    id: targetSnapshotId,
    campaignId: input.campaignId,
    targetKind: 'whole_hostel',
    targetKey: 'whole_hostel',
    threadId: input.thread.id,
    bookingId: input.thread.booking_id,
    targetMetadata: buildDefaultMetadata(input.thread.audience),
    eligibilityContext: {
      audience: input.thread.audience,
      channelType: input.thread.channel_type,
    },
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });

  const delivery = await upsertPrimeMessageCampaignDelivery(db, {
    id: deliveryId,
    campaignId: input.campaignId,
    targetSnapshotId,
    deliveryStatus: 'projected',
    threadId: input.thread.id,
    draftId: input.draftId,
    messageId: input.sentMessageId,
    projectionJobId: input.projectionJobId,
    attemptCount: 1,
    lastAttemptAt: input.occurredAt,
    sentAt: input.occurredAt,
    projectedAt: input.occurredAt,
    deliveryMetadata: {
      audience: input.thread.audience,
      deliveryModel: 'shared_whole_hostel_broadcast_thread',
      projectionTarget: 'firebase',
    },
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });

  await updatePrimeMessageCampaign(db, {
    campaignId: input.campaignId,
    status: 'sent',
    title: existingCampaign.title ?? buildDefaultCampaignTitle(input.thread),
    metadata: parseMetadata(existingCampaign.metadata_json) ?? buildDefaultMetadata(input.thread.audience),
    latestDraftId: input.draftId,
    sentMessageId: input.sentMessageId,
    targetCount: 1,
    sentCount: 1,
    projectedCount: delivery.delivery_status === 'projected' ? 1 : 0,
    failedCount: 0,
    lastError: null,
    createdByUid: existingCampaign.created_by_uid,
    reviewerUid: existingCampaign.reviewer_uid,
    updatedAt: input.occurredAt,
  });
}

export async function markWholeHostelCampaignReviewState(
  db: D1Database,
  input: {
    thread: PrimeMessageThreadRow;
    actorUid: string;
    occurredAt: number;
    status: 'resolved' | 'archived';
  },
): Promise<PrimeMessageCampaignRow | null> {
  const existingCampaign = await getLatestWholeHostelCampaign(db, input.thread.id);
  if (!existingCampaign) {
    return null;
  }

  return updatePrimeMessageCampaign(db, {
    campaignId: existingCampaign.id,
    status: input.status,
    title: existingCampaign.title ?? buildDefaultCampaignTitle(input.thread),
    metadata: buildDefaultMetadata(input.thread.audience),
    latestDraftId: existingCampaign.latest_draft_id,
    sentMessageId: existingCampaign.sent_message_id,
    createdByUid: existingCampaign.created_by_uid ?? input.actorUid,
    reviewerUid: input.actorUid,
    updatedAt: input.occurredAt,
  });
}

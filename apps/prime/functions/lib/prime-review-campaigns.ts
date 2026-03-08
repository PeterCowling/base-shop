import type { D1Database } from '@acme/platform-core/d1';

import type { MessageAudience } from '../../src/types/messenger/chat';

import {
  createPrimeMessageCampaign,
  getPrimeLatestMessageCampaignForThread,
  getPrimeMessageCampaignRecord,
  getPrimeMessageThread,
  type PrimeMessageCampaignDeliveryRow,
  type PrimeMessageCampaignRecord,
  type PrimeMessageCampaignRow,
  type PrimeMessageCampaignTargetKind,
  type PrimeMessageCampaignTargetSnapshotRow,
  type PrimeMessageThreadRow,
  updatePrimeMessageCampaign,
} from './prime-messaging-repositories';

export type PrimeReviewCampaignSummary = {
  id: string;
  threadId: string;
  type: PrimeMessageCampaignRow['campaign_type'];
  status: PrimeMessageCampaignRow['status'];
  audience: PrimeMessageCampaignRow['audience'];
  title: string | null;
  metadata: Record<string, unknown> | null;
  latestDraftId: string | null;
  sentMessageId: string | null;
  targetCount: number;
  sentCount: number;
  projectedCount: number;
  failedCount: number;
  lastError: string | null;
  createdByUid: string | null;
  reviewerUid: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrimeReviewCampaignTarget = {
  id: string;
  kind: PrimeMessageCampaignTargetSnapshotRow['target_kind'];
  key: string;
  threadId: string | null;
  bookingId: string | null;
  roomKey: string | null;
  guestUuid: string | null;
  externalContactKey: string | null;
  metadata: Record<string, unknown> | null;
  eligibilityContext: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type PrimeReviewCampaignDelivery = {
  id: string;
  targetSnapshotId: string;
  targetKind: PrimeMessageCampaignTargetSnapshotRow['target_kind'] | null;
  targetKey: string | null;
  status: PrimeMessageCampaignDeliveryRow['delivery_status'];
  threadId: string | null;
  draftId: string | null;
  messageId: string | null;
  projectionJobId: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  sentAt: string | null;
  projectedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type PrimeReviewCampaignDetail = PrimeReviewCampaignSummary & {
  targetSummary: {
    total: number;
    byKind: Array<{
      kind: PrimeMessageCampaignTargetKind;
      count: number;
    }>;
  };
  deliverySummary: {
    total: number;
    pending: number;
    ready: number;
    sent: number;
    projected: number;
    failed: number;
    cancelled: number;
    replayableCount: number;
    lastError: string | null;
  };
  targets: PrimeReviewCampaignTarget[];
  deliveries: PrimeReviewCampaignDelivery[];
};

type CreatePrimeReviewCampaignResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | { outcome: 'created'; campaign: PrimeReviewCampaignDetail };

type UpdatePrimeReviewCampaignResult =
  | { outcome: 'not_found' }
  | { outcome: 'updated'; campaign: PrimeReviewCampaignDetail };

function toIsoTimestamp(value: number | null): string | null {
  return typeof value === 'number' ? new Date(value).toISOString() : null;
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

function buildDefaultCampaignTitle(
  thread: Pick<PrimeMessageThreadRow, 'channel_type' | 'audience' | 'title' | 'booking_id'>,
): string {
  if (thread.title?.trim()) {
    return thread.title.trim();
  }

  if (thread.channel_type === 'broadcast' && thread.audience === 'whole_hostel') {
    return 'Whole-hostel broadcast';
  }

  return thread.channel_type === 'broadcast'
    ? `Prime broadcast ${thread.booking_id}`
    : `Prime campaign ${thread.booking_id}`;
}

function buildDefaultCampaignMetadata(
  thread: Pick<PrimeMessageThreadRow, 'channel_type' | 'audience' | 'id'>,
): Record<string, unknown> {
  return {
    audience: thread.audience,
    sourceThreadId: thread.id,
    deliveryModel: thread.channel_type === 'broadcast'
      ? 'broadcast_thread_projection'
      : 'thread_projection',
  };
}

function serializeCampaignSummary(campaign: PrimeMessageCampaignRow): PrimeReviewCampaignSummary {
  return {
    id: campaign.id,
    threadId: campaign.thread_id,
    type: campaign.campaign_type,
    status: campaign.status,
    audience: campaign.audience,
    title: campaign.title,
    metadata: parseMetadata(campaign.metadata_json),
    latestDraftId: campaign.latest_draft_id,
    sentMessageId: campaign.sent_message_id,
    targetCount: campaign.target_count,
    sentCount: campaign.sent_count,
    projectedCount: campaign.projected_count,
    failedCount: campaign.failed_count,
    lastError: campaign.last_error,
    createdByUid: campaign.created_by_uid,
    reviewerUid: campaign.reviewer_uid,
    createdAt: new Date(campaign.created_at).toISOString(),
    updatedAt: new Date(campaign.updated_at).toISOString(),
  };
}

function buildTargetSummary(targets: PrimeMessageCampaignTargetSnapshotRow[]) {
  const counts = new Map<PrimeMessageCampaignTargetKind, number>();

  for (const target of targets) {
    counts.set(target.target_kind, (counts.get(target.target_kind) ?? 0) + 1);
  }

  return {
    total: targets.length,
    byKind: Array.from(counts.entries()).map(([kind, count]) => ({ kind, count })),
  };
}

function buildDeliverySummary(deliveries: PrimeMessageCampaignDeliveryRow[]) {
  const summary = {
    total: deliveries.length,
    pending: 0,
    ready: 0,
    sent: 0,
    projected: 0,
    failed: 0,
    cancelled: 0,
    replayableCount: 0,
    lastError: null as string | null,
  };

  for (const delivery of deliveries) {
    if (delivery.delivery_status === 'pending') {
      summary.pending += 1;
      summary.replayableCount += 1;
    } else if (delivery.delivery_status === 'ready') {
      summary.ready += 1;
      summary.replayableCount += 1;
    } else if (delivery.delivery_status === 'sent') {
      summary.sent += 1;
      summary.replayableCount += 1;
    } else if (delivery.delivery_status === 'projected') {
      summary.projected += 1;
    } else if (delivery.delivery_status === 'failed') {
      summary.failed += 1;
      summary.replayableCount += 1;
      summary.lastError ??= delivery.last_error;
    } else if (delivery.delivery_status === 'cancelled') {
      summary.cancelled += 1;
    }
  }

  return summary;
}

function serializeTarget(
  target: PrimeMessageCampaignTargetSnapshotRow,
): PrimeReviewCampaignTarget {
  return {
    id: target.id,
    kind: target.target_kind,
    key: target.target_key,
    threadId: target.thread_id,
    bookingId: target.booking_id,
    roomKey: target.room_key,
    guestUuid: target.guest_uuid,
    externalContactKey: target.external_contact_key,
    metadata: parseMetadata(target.target_metadata_json),
    eligibilityContext: parseMetadata(target.eligibility_context_json),
    createdAt: new Date(target.created_at).toISOString(),
    updatedAt: new Date(target.updated_at).toISOString(),
  };
}

function serializeDelivery(
  delivery: PrimeMessageCampaignDeliveryRow,
  targetsById: Map<string, PrimeMessageCampaignTargetSnapshotRow>,
): PrimeReviewCampaignDelivery {
  const target = targetsById.get(delivery.target_snapshot_id) ?? null;

  return {
    id: delivery.id,
    targetSnapshotId: delivery.target_snapshot_id,
    targetKind: target?.target_kind ?? null,
    targetKey: target?.target_key ?? null,
    status: delivery.delivery_status,
    threadId: delivery.thread_id,
    draftId: delivery.draft_id,
    messageId: delivery.message_id,
    projectionJobId: delivery.projection_job_id,
    attemptCount: delivery.attempt_count,
    lastAttemptAt: toIsoTimestamp(delivery.last_attempt_at),
    lastError: delivery.last_error,
    sentAt: toIsoTimestamp(delivery.sent_at),
    projectedAt: toIsoTimestamp(delivery.projected_at),
    metadata: parseMetadata(delivery.delivery_metadata_json),
    createdAt: new Date(delivery.created_at).toISOString(),
    updatedAt: new Date(delivery.updated_at).toISOString(),
  };
}

export function serializePrimeReviewCampaignSummary(
  campaign: PrimeMessageCampaignRow,
): PrimeReviewCampaignSummary {
  return serializeCampaignSummary(campaign);
}

export function buildPrimeReviewCampaignDetail(
  record: PrimeMessageCampaignRecord,
): PrimeReviewCampaignDetail {
  const targetsById = new Map(record.targets.map((target) => [target.id, target]));
  const summary = serializeCampaignSummary(record.campaign);

  return {
    ...summary,
    targetSummary: buildTargetSummary(record.targets),
    deliverySummary: buildDeliverySummary(record.deliveries),
    targets: record.targets.map(serializeTarget),
    deliveries: record.deliveries.map((delivery) => serializeDelivery(delivery, targetsById)),
  };
}

export async function getPrimeReviewCampaignDetail(
  db: D1Database,
  campaignId: string,
): Promise<PrimeReviewCampaignDetail | null> {
  const record = await getPrimeMessageCampaignRecord(db, campaignId);
  return record ? buildPrimeReviewCampaignDetail(record) : null;
}

export async function createPrimeReviewCampaign(
  db: D1Database,
  input: {
    threadId: string;
    actorUid: string;
    campaignType?: PrimeMessageCampaignRow['campaign_type'];
    audience?: MessageAudience;
    title?: string | null;
    metadata?: Record<string, unknown> | null;
    latestDraftId?: string | null;
    occurredAt?: number;
  },
): Promise<CreatePrimeReviewCampaignResult> {
  const thread = await getPrimeMessageThread(db, input.threadId);
  if (!thread) {
    return { outcome: 'not_found' };
  }

  if (thread.channel_type !== 'broadcast') {
    return {
      outcome: 'conflict',
      message: 'Prime campaign APIs are only supported for broadcast threads',
    };
  }

  const occurredAt = input.occurredAt ?? Date.now();
  const latestCampaign = await getPrimeLatestMessageCampaignForThread(db, thread.id);

  const campaign = latestCampaign && !isTerminalCampaignStatus(latestCampaign.status)
    ? await updatePrimeMessageCampaign(db, {
        campaignId: latestCampaign.id,
        status: latestCampaign.status,
        title: input.title ?? latestCampaign.title ?? buildDefaultCampaignTitle(thread),
        metadata: input.metadata ?? parseMetadata(latestCampaign.metadata_json)
          ?? buildDefaultCampaignMetadata(thread),
        latestDraftId: input.latestDraftId ?? latestCampaign.latest_draft_id,
        sentMessageId: latestCampaign.sent_message_id,
        targetCount: latestCampaign.target_count,
        sentCount: latestCampaign.sent_count,
        projectedCount: latestCampaign.projected_count,
        failedCount: latestCampaign.failed_count,
        lastError: latestCampaign.last_error,
        createdByUid: latestCampaign.created_by_uid ?? input.actorUid,
        reviewerUid: input.actorUid,
        updatedAt: occurredAt,
      })
    : await createPrimeMessageCampaign(db, {
        id: `camp_${occurredAt}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        threadId: thread.id,
        campaignType: input.campaignType ?? 'broadcast',
        audience: input.audience ?? thread.audience,
        status: 'drafting',
        title: input.title ?? buildDefaultCampaignTitle(thread),
        metadata: input.metadata ?? buildDefaultCampaignMetadata(thread),
        latestDraftId: input.latestDraftId ?? null,
        createdByUid: input.actorUid,
        reviewerUid: input.actorUid,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      });

  if (!campaign) {
    return { outcome: 'not_found' };
  }

  const detail = await getPrimeReviewCampaignDetail(db, campaign.id);
  if (!detail) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'created',
    campaign: detail,
  };
}

export async function updatePrimeReviewCampaign(
  db: D1Database,
  input: {
    campaignId: string;
    actorUid: string;
    status?: PrimeMessageCampaignRow['status'];
    title?: string | null;
    metadata?: Record<string, unknown> | null;
    latestDraftId?: string | null;
    occurredAt?: number;
  },
): Promise<UpdatePrimeReviewCampaignResult> {
  const detail = await getPrimeReviewCampaignDetail(db, input.campaignId);
  if (!detail) {
    return { outcome: 'not_found' };
  }

  const updated = await updatePrimeMessageCampaign(db, {
    campaignId: input.campaignId,
    status: input.status ?? detail.status,
    title: input.title ?? detail.title,
    metadata: input.metadata ?? detail.metadata,
    latestDraftId: input.latestDraftId ?? detail.latestDraftId,
    sentMessageId: detail.sentMessageId,
    targetCount: detail.targetCount,
    sentCount: detail.sentCount,
    projectedCount: detail.projectedCount,
    failedCount: detail.failedCount,
    lastError: detail.lastError,
    createdByUid: detail.createdByUid,
    reviewerUid: input.actorUid,
    updatedAt: input.occurredAt ?? Date.now(),
  });

  if (!updated) {
    return { outcome: 'not_found' };
  }

  const updatedDetail = await getPrimeReviewCampaignDetail(db, updated.id);
  if (!updatedDetail) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'updated',
    campaign: updatedDetail,
  };
}

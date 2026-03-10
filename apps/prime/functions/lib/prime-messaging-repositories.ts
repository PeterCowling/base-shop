/* eslint-disable ds/no-hardcoded-copy -- PRIME-101 [ttl=2026-12-31] Repository SQL statements and persistence literals are non-UI strings. */
import type { D1Database } from '@acme/platform-core/d1';

import type {
  MessageAttachment,
  MessageAudience,
  MessageCard,
  MessageDraftSource,
  MessageDraftStatus,
  MessageKind,
  MessageLink,
} from '../../src/types/messenger/chat';
import type { Role } from '../../src/types/messenger/roles';

export const primeMessagingChannelTypes = ['direct', 'broadcast'] as const;
export type PrimeMessagingChannelType = (typeof primeMessagingChannelTypes)[number];

export const primeMessagingTakeoverStates = ['automated', 'staff_active', 'suppressed'] as const;
export type PrimeMessagingTakeoverState = (typeof primeMessagingTakeoverStates)[number];

export const primeReviewStatuses = ['pending', 'review_later', 'auto_archived', 'resolved', 'sent'] as const;
export type PrimeReviewStatus = (typeof primeReviewStatuses)[number];

export const primeMessageAdmissionDecisions = [
  'queued',
  'draft_created',
  'suppressed',
  'manual_takeover',
  'resolved',
  'dismissed',
  'sent',
] as const;
export type PrimeMessageAdmissionDecision = (typeof primeMessageAdmissionDecisions)[number];

export const primeProjectionEntityTypes = ['message', 'draft'] as const;
export type PrimeProjectionEntityType = (typeof primeProjectionEntityTypes)[number];

export const primeProjectionJobStatuses = ['pending', 'projected', 'failed'] as const;
export type PrimeProjectionJobStatus = (typeof primeProjectionJobStatuses)[number];

export const primeMessageCampaignTypes = [
  'broadcast',
  'referral',
  'event_invite',
  'return_offer',
] as const;
export type PrimeMessageCampaignType = (typeof primeMessageCampaignTypes)[number];

export const primeMessageCampaignStatuses = [
  'drafting',
  'under_review',
  'sent',
  'resolved',
  'archived',
] as const;
export type PrimeMessageCampaignStatus = (typeof primeMessageCampaignStatuses)[number];

export const primeMessageCampaignTargetKinds = [
  'whole_hostel',
  'booking',
  'room',
  'guest',
  'external_contact',
  'segment',
] as const;
export type PrimeMessageCampaignTargetKind = (typeof primeMessageCampaignTargetKinds)[number];

export const primeMessageCampaignDeliveryStatuses = [
  'pending',
  'ready',
  'sent',
  'projected',
  'failed',
  'cancelled',
] as const;
export type PrimeMessageCampaignDeliveryStatus =
  (typeof primeMessageCampaignDeliveryStatuses)[number];

export type PrimeMessageThreadRow = {
  id: string;
  booking_id: string;
  channel_type: PrimeMessagingChannelType;
  audience: MessageAudience;
  member_uids_json: string | null;
  title: string | null;
  latest_message_at: number | null;
  latest_inbound_message_at: number | null;
  last_staff_reply_at: number | null;
  takeover_state: PrimeMessagingTakeoverState;
  review_status: PrimeReviewStatus;
  suppression_reason: string | null;
  metadata_json: string | null;
  created_at: number;
  updated_at: number;
};

export type PrimeMessageRecordRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: Role;
  sender_name: string | null;
  content: string;
  kind: MessageKind;
  audience: MessageAudience;
  links_json: string | null;
  attachments_json: string | null;
  cards_json: string | null;
  campaign_id: string | null;
  draft_id: string | null;
  deleted: number;
  created_at: number;
};

export type PrimeMessageDraftRow = {
  id: string;
  thread_id: string;
  status: MessageDraftStatus;
  source: MessageDraftSource;
  content: string;
  kind: MessageKind;
  audience: MessageAudience;
  links_json: string | null;
  attachments_json: string | null;
  cards_json: string | null;
  quality_json: string | null;
  interpret_json: string | null;
  created_by_uid: string | null;
  reviewer_uid: string | null;
  suppression_reason: string | null;
  sent_message_id: string | null;
  created_at: number;
  updated_at: number;
};

export type PrimeMessageAdmissionRow = {
  id: number;
  thread_id: string;
  draft_id: string | null;
  decision: PrimeMessageAdmissionDecision;
  reason: string | null;
  source: string;
  classifier_version: string | null;
  source_metadata_json: string | null;
  created_at: number;
};

export type PrimeMessageProjectionJobRow = {
  id: string;
  thread_id: string;
  entity_type: PrimeProjectionEntityType;
  entity_id: string;
  projection_target: string;
  status: PrimeProjectionJobStatus;
  attempt_count: number;
  last_attempt_at: number | null;
  last_error: string | null;
  created_at: number;
  updated_at: number;
};

export type PrimeMessageCampaignRow = {
  id: string;
  thread_id: string;
  campaign_type: PrimeMessageCampaignType;
  audience: MessageAudience;
  status: PrimeMessageCampaignStatus;
  title: string | null;
  metadata_json: string | null;
  latest_draft_id: string | null;
  sent_message_id: string | null;
  target_count: number;
  sent_count: number;
  projected_count: number;
  failed_count: number;
  last_error: string | null;
  created_by_uid: string | null;
  reviewer_uid: string | null;
  created_at: number;
  updated_at: number;
};

export type PrimeMessageCampaignTargetSnapshotRow = {
  id: string;
  campaign_id: string;
  target_kind: PrimeMessageCampaignTargetKind;
  target_key: string;
  thread_id: string | null;
  booking_id: string | null;
  room_key: string | null;
  guest_uuid: string | null;
  external_contact_key: string | null;
  target_metadata_json: string | null;
  eligibility_context_json: string | null;
  created_at: number;
  updated_at: number;
};

export type PrimeMessageCampaignDeliveryRow = {
  id: string;
  campaign_id: string;
  target_snapshot_id: string;
  delivery_status: PrimeMessageCampaignDeliveryStatus;
  thread_id: string | null;
  draft_id: string | null;
  message_id: string | null;
  projection_job_id: string | null;
  attempt_count: number;
  last_attempt_at: number | null;
  last_error: string | null;
  sent_at: number | null;
  projected_at: number | null;
  delivery_metadata_json: string | null;
  created_at: number;
  updated_at: number;
};

export type PrimeMessageThreadRecord = {
  thread: PrimeMessageThreadRow;
  messages: PrimeMessageRecordRow[];
  drafts: PrimeMessageDraftRow[];
  admissions: PrimeMessageAdmissionRow[];
  projectionJobs: PrimeMessageProjectionJobRow[];
  campaigns: PrimeMessageCampaignRow[];
};

export type PrimeReviewThreadListRow = PrimeMessageThreadRow & {
  latest_message_content: string | null;
  latest_message_kind: MessageKind | null;
  latest_admission_decision: PrimeMessageAdmissionDecision | null;
  latest_admission_reason: string | null;
  latest_admission_source: string | null;
  latest_admission_created_at: number | null;
};

export type CreatePrimeMessageThreadInput = {
  id: string;
  bookingId: string;
  channelType: PrimeMessagingChannelType;
  audience?: MessageAudience;
  memberUids?: string[] | null;
  title?: string | null;
  latestMessageAt?: number | null;
  latestInboundMessageAt?: number | null;
  lastStaffReplyAt?: number | null;
  takeoverState?: PrimeMessagingTakeoverState;
  reviewStatus?: PrimeReviewStatus;
  suppressionReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: number;
  updatedAt?: number;
};

export type UpdatePrimeMessageThreadReviewStatusInput = {
  threadId: string;
  reviewStatus: PrimeReviewStatus;
  updatedAt?: number;
};

export type CreatePrimeMessageInput = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: Role;
  senderName?: string | null;
  content: string;
  kind?: MessageKind;
  audience?: MessageAudience;
  links?: MessageLink[] | null;
  attachments?: MessageAttachment[] | null;
  cards?: MessageCard[] | null;
  campaignId?: string | null;
  draftId?: string | null;
  deleted?: boolean;
  createdAt: number;
};

export type CreatePrimeMessageDraftInput = {
  id: string;
  threadId: string;
  status: MessageDraftStatus;
  source: MessageDraftSource;
  content: string;
  kind?: MessageKind;
  audience?: MessageAudience;
  links?: MessageLink[] | null;
  attachments?: MessageAttachment[] | null;
  cards?: MessageCard[] | null;
  quality?: Record<string, unknown> | null;
  interpret?: Record<string, unknown> | null;
  createdByUid?: string | null;
  reviewerUid?: string | null;
  suppressionReason?: string | null;
  sentMessageId?: string | null;
  createdAt: number;
  updatedAt?: number;
};

export type UpdatePrimeMessageDraftInput = {
  draftId: string;
  status: MessageDraftStatus;
  content: string;
  kind?: MessageKind;
  audience?: MessageAudience;
  links?: MessageLink[] | null;
  attachments?: MessageAttachment[] | null;
  cards?: MessageCard[] | null;
  quality?: Record<string, unknown> | null;
  interpret?: Record<string, unknown> | null;
  createdByUid?: string | null;
  reviewerUid?: string | null;
  suppressionReason?: string | null;
  sentMessageId?: string | null;
  updatedAt?: number;
};

export type RecordPrimeMessageAdmissionInput = {
  threadId: string;
  draftId?: string | null;
  decision: PrimeMessageAdmissionDecision;
  reason?: string | null;
  source: string;
  classifierVersion?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
  createdAt: number;
};

export type EnqueuePrimeProjectionJobInput = {
  id: string;
  threadId: string;
  entityType: PrimeProjectionEntityType;
  entityId: string;
  projectionTarget?: string;
  status?: PrimeProjectionJobStatus;
  attemptCount?: number;
  lastAttemptAt?: number | null;
  lastError?: string | null;
  createdAt: number;
  updatedAt?: number;
};

export type UpdatePrimeProjectionJobInput = {
  jobId: string;
  status: PrimeProjectionJobStatus;
  attemptCount: number;
  lastAttemptAt?: number | null;
  lastError?: string | null;
  updatedAt?: number;
};

export type CreatePrimeMessageCampaignInput = {
  id: string;
  threadId: string;
  campaignType?: PrimeMessageCampaignType;
  audience?: MessageAudience;
  status?: PrimeMessageCampaignStatus;
  title?: string | null;
  metadata?: Record<string, unknown> | null;
  latestDraftId?: string | null;
  sentMessageId?: string | null;
  createdByUid?: string | null;
  reviewerUid?: string | null;
  createdAt: number;
  updatedAt?: number;
};

export type UpdatePrimeMessageCampaignInput = {
  campaignId: string;
  status: PrimeMessageCampaignStatus;
  title?: string | null;
  metadata?: Record<string, unknown> | null;
  latestDraftId?: string | null;
  sentMessageId?: string | null;
  targetCount?: number;
  sentCount?: number;
  projectedCount?: number;
  failedCount?: number;
  lastError?: string | null;
  createdByUid?: string | null;
  reviewerUid?: string | null;
  updatedAt?: number;
};

export type UpsertPrimeMessageCampaignTargetSnapshotInput = {
  id: string;
  campaignId: string;
  targetKind: PrimeMessageCampaignTargetKind;
  targetKey: string;
  threadId?: string | null;
  bookingId?: string | null;
  roomKey?: string | null;
  guestUuid?: string | null;
  externalContactKey?: string | null;
  targetMetadata?: Record<string, unknown> | null;
  eligibilityContext?: Record<string, unknown> | null;
  createdAt: number;
  updatedAt?: number;
};

export type UpsertPrimeMessageCampaignDeliveryInput = {
  id: string;
  campaignId: string;
  targetSnapshotId: string;
  deliveryStatus?: PrimeMessageCampaignDeliveryStatus;
  threadId?: string | null;
  draftId?: string | null;
  messageId?: string | null;
  projectionJobId?: string | null;
  attemptCount?: number;
  lastAttemptAt?: number | null;
  lastError?: string | null;
  sentAt?: number | null;
  projectedAt?: number | null;
  deliveryMetadata?: Record<string, unknown> | null;
  createdAt: number;
  updatedAt?: number;
};

export type UpdatePrimeMessageCampaignDeliveryInput = {
  deliveryId: string;
  deliveryStatus: PrimeMessageCampaignDeliveryStatus;
  threadId?: string | null;
  draftId?: string | null;
  messageId?: string | null;
  projectionJobId?: string | null;
  attemptCount?: number;
  lastAttemptAt?: number | null;
  lastError?: string | null;
  sentAt?: number | null;
  projectedAt?: number | null;
  deliveryMetadata?: Record<string, unknown> | null;
  updatedAt?: number;
};

export type PrimeMessageCampaignRecord = {
  campaign: PrimeMessageCampaignRow;
  targets: PrimeMessageCampaignTargetSnapshotRow[];
  deliveries: PrimeMessageCampaignDeliveryRow[];
};

function stringifyJson(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.stringify(value);
}

function decodeRows<T>(result: { results?: T[] } | null | undefined): T[] {
  return result?.results ?? [];
}

export async function getPrimeMessageThread(
  db: D1Database,
  threadId: string,
): Promise<PrimeMessageThreadRow | null> {
  return db
    .prepare('SELECT * FROM message_threads WHERE id = ?')
    .bind(threadId)
    .first<PrimeMessageThreadRow>();
}

export async function getPrimeMessage(
  db: D1Database,
  messageId: string,
): Promise<PrimeMessageRecordRow | null> {
  return db
    .prepare('SELECT * FROM message_records WHERE id = ?')
    .bind(messageId)
    .first<PrimeMessageRecordRow>();
}

export async function getPrimeMessageDraft(
  db: D1Database,
  draftId: string,
): Promise<PrimeMessageDraftRow | null> {
  return db
    .prepare('SELECT * FROM message_drafts WHERE id = ?')
    .bind(draftId)
    .first<PrimeMessageDraftRow>();
}

export async function getPrimeProjectionJob(
  db: D1Database,
  jobId: string,
): Promise<PrimeMessageProjectionJobRow | null> {
  return db
    .prepare('SELECT * FROM message_projection_jobs WHERE id = ?')
    .bind(jobId)
    .first<PrimeMessageProjectionJobRow>();
}

export async function getPrimeMessageCampaign(
  db: D1Database,
  campaignId: string,
): Promise<PrimeMessageCampaignRow | null> {
  return db
    .prepare('SELECT * FROM message_campaigns WHERE id = ?')
    .bind(campaignId)
    .first<PrimeMessageCampaignRow>();
}

export async function listPrimeMessageCampaignsForThread(
  db: D1Database,
  threadId: string,
): Promise<PrimeMessageCampaignRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    )
    .bind(threadId)
    .all<PrimeMessageCampaignRow>();

  return decodeRows(result);
}

export async function getPrimeLatestMessageCampaignForThread(
  db: D1Database,
  threadId: string,
): Promise<PrimeMessageCampaignRow | null> {
  return db
    .prepare(
      `SELECT * FROM message_campaigns
       WHERE thread_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1`
    )
    .bind(threadId)
    .first<PrimeMessageCampaignRow>();
}

export async function getPrimeMessageCampaignTargetSnapshot(
  db: D1Database,
  snapshotId: string,
): Promise<PrimeMessageCampaignTargetSnapshotRow | null> {
  return db
    .prepare('SELECT * FROM message_campaign_target_snapshots WHERE id = ?')
    .bind(snapshotId)
    .first<PrimeMessageCampaignTargetSnapshotRow>();
}

export async function listPrimeMessageCampaignTargetSnapshots(
  db: D1Database,
  campaignId: string,
): Promise<PrimeMessageCampaignTargetSnapshotRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM message_campaign_target_snapshots
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    )
    .bind(campaignId)
    .all<PrimeMessageCampaignTargetSnapshotRow>();

  return decodeRows(result);
}

export async function getPrimeMessageCampaignDelivery(
  db: D1Database,
  deliveryId: string,
): Promise<PrimeMessageCampaignDeliveryRow | null> {
  return db
    .prepare('SELECT * FROM message_campaign_deliveries WHERE id = ?')
    .bind(deliveryId)
    .first<PrimeMessageCampaignDeliveryRow>();
}

export async function listPrimeMessageCampaignDeliveries(
  db: D1Database,
  campaignId: string,
): Promise<PrimeMessageCampaignDeliveryRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM message_campaign_deliveries
       WHERE campaign_id = ?
       ORDER BY updated_at DESC, created_at DESC, id DESC`
    )
    .bind(campaignId)
    .all<PrimeMessageCampaignDeliveryRow>();

  return decodeRows(result);
}

export async function getPrimeMessageCampaignRecord(
  db: D1Database,
  campaignId: string,
): Promise<PrimeMessageCampaignRecord | null> {
  const campaign = await getPrimeMessageCampaign(db, campaignId);
  if (!campaign) {
    return null;
  }

  const [targets, deliveries] = await Promise.all([
    listPrimeMessageCampaignTargetSnapshots(db, campaignId),
    listPrimeMessageCampaignDeliveries(db, campaignId),
  ]);

  return {
    campaign,
    targets,
    deliveries,
  };
}

export async function createPrimeMessageThread(
  db: D1Database,
  input: CreatePrimeMessageThreadInput,
): Promise<PrimeMessageThreadRow> {
  const createdAt = input.createdAt ?? Date.now();
  const updatedAt = input.updatedAt ?? createdAt;
  const row: PrimeMessageThreadRow = {
    id: input.id,
    booking_id: input.bookingId,
    channel_type: input.channelType,
    audience: input.audience ?? 'thread',
    member_uids_json: stringifyJson(input.memberUids ?? null),
    title: input.title ?? null,
    latest_message_at: input.latestMessageAt ?? null,
    latest_inbound_message_at: input.latestInboundMessageAt ?? null,
    last_staff_reply_at: input.lastStaffReplyAt ?? null,
    takeover_state: input.takeoverState ?? 'automated',
    review_status: input.reviewStatus ?? 'pending',
    suppression_reason: input.suppressionReason ?? null,
    metadata_json: stringifyJson(input.metadata ?? null),
    created_at: createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_threads (
      id,
      booking_id,
      channel_type,
      audience,
      member_uids_json,
      title,
      latest_message_at,
      latest_inbound_message_at,
      last_staff_reply_at,
      takeover_state,
      review_status,
      suppression_reason,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.id,
      row.booking_id,
      row.channel_type,
      row.audience,
      row.member_uids_json,
      row.title,
      row.latest_message_at,
      row.latest_inbound_message_at,
      row.last_staff_reply_at,
      row.takeover_state,
      row.review_status,
      row.suppression_reason,
      row.metadata_json,
      row.created_at,
      row.updated_at,
    )
    .run();

  return row;
}

export async function upsertPrimeMessageThread(
  db: D1Database,
  input: CreatePrimeMessageThreadInput,
): Promise<PrimeMessageThreadRow> {
  const createdAt = input.createdAt ?? Date.now();
  const updatedAt = input.updatedAt ?? createdAt;
  const row: PrimeMessageThreadRow = {
    id: input.id,
    booking_id: input.bookingId,
    channel_type: input.channelType,
    audience: input.audience ?? 'thread',
    member_uids_json: stringifyJson(input.memberUids ?? null),
    title: input.title ?? null,
    latest_message_at: input.latestMessageAt ?? null,
    latest_inbound_message_at: input.latestInboundMessageAt ?? null,
    last_staff_reply_at: input.lastStaffReplyAt ?? null,
    takeover_state: input.takeoverState ?? 'automated',
    review_status: input.reviewStatus ?? 'pending',
    suppression_reason: input.suppressionReason ?? null,
    metadata_json: stringifyJson(input.metadata ?? null),
    created_at: createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_threads (
      id,
      booking_id,
      channel_type,
      audience,
      member_uids_json,
      title,
      latest_message_at,
      latest_inbound_message_at,
      last_staff_reply_at,
      takeover_state,
      review_status,
      suppression_reason,
      metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      booking_id = excluded.booking_id,
      channel_type = excluded.channel_type,
      audience = excluded.audience,
      member_uids_json = excluded.member_uids_json,
      title = excluded.title,
      latest_message_at = excluded.latest_message_at,
      latest_inbound_message_at = excluded.latest_inbound_message_at,
      last_staff_reply_at = excluded.last_staff_reply_at,
      takeover_state = excluded.takeover_state,
      review_status = excluded.review_status,
      suppression_reason = excluded.suppression_reason,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at`
  )
    .bind(
      row.id,
      row.booking_id,
      row.channel_type,
      row.audience,
      row.member_uids_json,
      row.title,
      row.latest_message_at,
      row.latest_inbound_message_at,
      row.last_staff_reply_at,
      row.takeover_state,
      row.review_status,
      row.suppression_reason,
      row.metadata_json,
      row.created_at,
      row.updated_at,
    )
    .run();

  return row;
}

export async function updatePrimeMessageThreadReviewStatus(
  db: D1Database,
  input: UpdatePrimeMessageThreadReviewStatusInput,
): Promise<PrimeMessageThreadRow | null> {
  await db.prepare(
    `UPDATE message_threads
     SET review_status = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(input.reviewStatus, input.updatedAt ?? Date.now(), input.threadId)
    .run();

  return getPrimeMessageThread(db, input.threadId);
}

export async function createPrimeMessage(
  db: D1Database,
  input: CreatePrimeMessageInput,
): Promise<PrimeMessageRecordRow> {
  const row: PrimeMessageRecordRow = {
    id: input.id,
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    sender_name: input.senderName ?? null,
    content: input.content,
    kind: input.kind ?? 'support',
    audience: input.audience ?? 'thread',
    links_json: stringifyJson(input.links ?? null),
    attachments_json: stringifyJson(input.attachments ?? null),
    cards_json: stringifyJson(input.cards ?? null),
    campaign_id: input.campaignId ?? null,
    draft_id: input.draftId ?? null,
    deleted: input.deleted ? 1 : 0,
    created_at: input.createdAt,
  };

  await db.prepare(
    `INSERT INTO message_records (
      id,
      thread_id,
      sender_id,
      sender_role,
      sender_name,
      content,
      kind,
      audience,
      links_json,
      attachments_json,
      cards_json,
      campaign_id,
      draft_id,
      deleted,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.id,
      row.thread_id,
      row.sender_id,
      row.sender_role,
      row.sender_name,
      row.content,
      row.kind,
      row.audience,
      row.links_json,
      row.attachments_json,
      row.cards_json,
      row.campaign_id,
      row.draft_id,
      row.deleted,
      row.created_at,
    )
    .run();

  return row;
}

export async function createPrimeMessageDraft(
  db: D1Database,
  input: CreatePrimeMessageDraftInput,
): Promise<PrimeMessageDraftRow> {
  const updatedAt = input.updatedAt ?? input.createdAt;
  const row: PrimeMessageDraftRow = {
    id: input.id,
    thread_id: input.threadId,
    status: input.status,
    source: input.source,
    content: input.content,
    kind: input.kind ?? 'draft',
    audience: input.audience ?? 'thread',
    links_json: stringifyJson(input.links ?? null),
    attachments_json: stringifyJson(input.attachments ?? null),
    cards_json: stringifyJson(input.cards ?? null),
    quality_json: stringifyJson(input.quality ?? null),
    interpret_json: stringifyJson(input.interpret ?? null),
    created_by_uid: input.createdByUid ?? null,
    reviewer_uid: input.reviewerUid ?? null,
    suppression_reason: input.suppressionReason ?? null,
    sent_message_id: input.sentMessageId ?? null,
    created_at: input.createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_drafts (
      id,
      thread_id,
      status,
      source,
      content,
      kind,
      audience,
      links_json,
      attachments_json,
      cards_json,
      quality_json,
      interpret_json,
      created_by_uid,
      reviewer_uid,
      suppression_reason,
      sent_message_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.id,
      row.thread_id,
      row.status,
      row.source,
      row.content,
      row.kind,
      row.audience,
      row.links_json,
      row.attachments_json,
      row.cards_json,
      row.quality_json,
      row.interpret_json,
      row.created_by_uid,
      row.reviewer_uid,
      row.suppression_reason,
      row.sent_message_id,
      row.created_at,
      row.updated_at,
    )
    .run();

  return row;
}

export async function updatePrimeMessageDraft(
  db: D1Database,
  input: UpdatePrimeMessageDraftInput,
): Promise<PrimeMessageDraftRow | null> {
  const updatedAt = input.updatedAt ?? Date.now();

  await db.prepare(
    `UPDATE message_drafts
     SET status = ?,
         content = ?,
         kind = ?,
         audience = ?,
         links_json = ?,
         attachments_json = ?,
         cards_json = ?,
         quality_json = ?,
         interpret_json = ?,
         created_by_uid = ?,
         reviewer_uid = ?,
         suppression_reason = ?,
         sent_message_id = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      input.status,
      input.content,
      input.kind ?? 'draft',
      input.audience ?? 'thread',
      stringifyJson(input.links ?? null),
      stringifyJson(input.attachments ?? null),
      stringifyJson(input.cards ?? null),
      stringifyJson(input.quality ?? null),
      stringifyJson(input.interpret ?? null),
      input.createdByUid ?? null,
      input.reviewerUid ?? null,
      input.suppressionReason ?? null,
      input.sentMessageId ?? null,
      updatedAt,
      input.draftId,
    )
    .run();

  return db
    .prepare('SELECT * FROM message_drafts WHERE id = ?')
    .bind(input.draftId)
    .first<PrimeMessageDraftRow>();
}

export async function recordPrimeMessageAdmission(
  db: D1Database,
  input: RecordPrimeMessageAdmissionInput,
): Promise<void> {
  await db.prepare(
    `INSERT INTO message_admissions (
      thread_id,
      draft_id,
      decision,
      reason,
      source,
      classifier_version,
      source_metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      input.threadId,
      input.draftId ?? null,
      input.decision,
      input.reason ?? null,
      input.source,
      input.classifierVersion ?? null,
      stringifyJson(input.sourceMetadata ?? null),
      input.createdAt,
    )
    .run();
}

export async function enqueuePrimeProjectionJob(
  db: D1Database,
  input: EnqueuePrimeProjectionJobInput,
): Promise<PrimeMessageProjectionJobRow> {
  const updatedAt = input.updatedAt ?? input.createdAt;
  const row: PrimeMessageProjectionJobRow = {
    id: input.id,
    thread_id: input.threadId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    projection_target: input.projectionTarget ?? 'firebase',
    status: input.status ?? 'pending',
    attempt_count: input.attemptCount ?? 0,
    last_attempt_at: input.lastAttemptAt ?? null,
    last_error: input.lastError ?? null,
    created_at: input.createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_projection_jobs (
      id,
      thread_id,
      entity_type,
      entity_id,
      projection_target,
      status,
      attempt_count,
      last_attempt_at,
      last_error,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.id,
      row.thread_id,
      row.entity_type,
      row.entity_id,
      row.projection_target,
      row.status,
      row.attempt_count,
      row.last_attempt_at,
      row.last_error,
      row.created_at,
      row.updated_at,
    )
    .run();

  return row;
}

export async function updatePrimeProjectionJob(
  db: D1Database,
  input: UpdatePrimeProjectionJobInput,
): Promise<PrimeMessageProjectionJobRow | null> {
  const updatedAt = input.updatedAt ?? Date.now();

  await db.prepare(
    `UPDATE message_projection_jobs
     SET status = ?,
         attempt_count = ?,
         last_attempt_at = ?,
         last_error = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      input.status,
      input.attemptCount,
      input.lastAttemptAt ?? null,
      input.lastError ?? null,
      updatedAt,
      input.jobId,
    )
    .run();

  return getPrimeProjectionJob(db, input.jobId);
}

export async function createPrimeMessageCampaign(
  db: D1Database,
  input: CreatePrimeMessageCampaignInput,
): Promise<PrimeMessageCampaignRow> {
  const updatedAt = input.updatedAt ?? input.createdAt;
  const row: PrimeMessageCampaignRow = {
    id: input.id,
    thread_id: input.threadId,
    campaign_type: input.campaignType ?? 'broadcast',
    audience: input.audience ?? 'whole_hostel',
    status: input.status ?? 'drafting',
    title: input.title ?? null,
    metadata_json: stringifyJson(input.metadata ?? null),
    latest_draft_id: input.latestDraftId ?? null,
    sent_message_id: input.sentMessageId ?? null,
    target_count: 0,
    sent_count: 0,
    projected_count: 0,
    failed_count: 0,
    last_error: null,
    created_by_uid: input.createdByUid ?? null,
    reviewer_uid: input.reviewerUid ?? null,
    created_at: input.createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_campaigns (
      id,
      thread_id,
      campaign_type,
      audience,
      status,
      title,
      metadata_json,
      latest_draft_id,
      sent_message_id,
      target_count,
      sent_count,
      projected_count,
      failed_count,
      last_error,
      created_by_uid,
      reviewer_uid,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.id,
      row.thread_id,
      row.campaign_type,
      row.audience,
      row.status,
      row.title,
      row.metadata_json,
      row.latest_draft_id,
      row.sent_message_id,
      row.target_count,
      row.sent_count,
      row.projected_count,
      row.failed_count,
      row.last_error,
      row.created_by_uid,
      row.reviewer_uid,
      row.created_at,
      row.updated_at,
    )
    .run();

  return row;
}

export async function updatePrimeMessageCampaign(
  db: D1Database,
  input: UpdatePrimeMessageCampaignInput,
): Promise<PrimeMessageCampaignRow | null> {
  const updatedAt = input.updatedAt ?? Date.now();
  const existingCampaign = await getPrimeMessageCampaign(db, input.campaignId);
  if (!existingCampaign) {
    return null;
  }

  await db.prepare(
    `UPDATE message_campaigns
     SET status = ?,
         title = ?,
         metadata_json = ?,
         latest_draft_id = ?,
         sent_message_id = ?,
         target_count = ?,
         sent_count = ?,
         projected_count = ?,
         failed_count = ?,
         last_error = ?,
         created_by_uid = ?,
         reviewer_uid = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      input.status,
      input.title ?? null,
      stringifyJson(input.metadata ?? null),
      input.latestDraftId ?? null,
      input.sentMessageId ?? null,
      input.targetCount ?? existingCampaign.target_count,
      input.sentCount ?? existingCampaign.sent_count,
      input.projectedCount ?? existingCampaign.projected_count,
      input.failedCount ?? existingCampaign.failed_count,
      input.lastError ?? existingCampaign.last_error,
      input.createdByUid ?? null,
      input.reviewerUid ?? null,
      updatedAt,
      input.campaignId,
    )
    .run();

  return getPrimeMessageCampaign(db, input.campaignId);
}

export async function upsertPrimeMessageCampaignTargetSnapshot(
  db: D1Database,
  input: UpsertPrimeMessageCampaignTargetSnapshotInput,
): Promise<PrimeMessageCampaignTargetSnapshotRow> {
  const updatedAt = input.updatedAt ?? input.createdAt;
  const row: PrimeMessageCampaignTargetSnapshotRow = {
    id: input.id,
    campaign_id: input.campaignId,
    target_kind: input.targetKind,
    target_key: input.targetKey,
    thread_id: input.threadId ?? null,
    booking_id: input.bookingId ?? null,
    room_key: input.roomKey ?? null,
    guest_uuid: input.guestUuid ?? null,
    external_contact_key: input.externalContactKey ?? null,
    target_metadata_json: stringifyJson(input.targetMetadata ?? null),
    eligibility_context_json: stringifyJson(input.eligibilityContext ?? null),
    created_at: input.createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_campaign_target_snapshots (
      id,
      campaign_id,
      target_kind,
      target_key,
      thread_id,
      booking_id,
      room_key,
      guest_uuid,
      external_contact_key,
      target_metadata_json,
      eligibility_context_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      campaign_id = excluded.campaign_id,
      target_kind = excluded.target_kind,
      target_key = excluded.target_key,
      thread_id = excluded.thread_id,
      booking_id = excluded.booking_id,
      room_key = excluded.room_key,
      guest_uuid = excluded.guest_uuid,
      external_contact_key = excluded.external_contact_key,
      target_metadata_json = excluded.target_metadata_json,
      eligibility_context_json = excluded.eligibility_context_json,
      updated_at = excluded.updated_at`
  )
    .bind(
      row.id,
      row.campaign_id,
      row.target_kind,
      row.target_key,
      row.thread_id,
      row.booking_id,
      row.room_key,
      row.guest_uuid,
      row.external_contact_key,
      row.target_metadata_json,
      row.eligibility_context_json,
      row.created_at,
      row.updated_at,
    )
    .run();

  const snapshot = await getPrimeMessageCampaignTargetSnapshot(db, input.id);
  if (!snapshot) {
    throw new Error(`Prime campaign target snapshot ${input.id} not found after upsert`);
  }

  return snapshot;
}

export async function upsertPrimeMessageCampaignDelivery(
  db: D1Database,
  input: UpsertPrimeMessageCampaignDeliveryInput,
): Promise<PrimeMessageCampaignDeliveryRow> {
  const updatedAt = input.updatedAt ?? input.createdAt;
  const row: PrimeMessageCampaignDeliveryRow = {
    id: input.id,
    campaign_id: input.campaignId,
    target_snapshot_id: input.targetSnapshotId,
    delivery_status: input.deliveryStatus ?? 'pending',
    thread_id: input.threadId ?? null,
    draft_id: input.draftId ?? null,
    message_id: input.messageId ?? null,
    projection_job_id: input.projectionJobId ?? null,
    attempt_count: input.attemptCount ?? 0,
    last_attempt_at: input.lastAttemptAt ?? null,
    last_error: input.lastError ?? null,
    sent_at: input.sentAt ?? null,
    projected_at: input.projectedAt ?? null,
    delivery_metadata_json: stringifyJson(input.deliveryMetadata ?? null),
    created_at: input.createdAt,
    updated_at: updatedAt,
  };

  await db.prepare(
    `INSERT INTO message_campaign_deliveries (
      id,
      campaign_id,
      target_snapshot_id,
      delivery_status,
      thread_id,
      draft_id,
      message_id,
      projection_job_id,
      attempt_count,
      last_attempt_at,
      last_error,
      sent_at,
      projected_at,
      delivery_metadata_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      campaign_id = excluded.campaign_id,
      target_snapshot_id = excluded.target_snapshot_id,
      delivery_status = excluded.delivery_status,
      thread_id = excluded.thread_id,
      draft_id = excluded.draft_id,
      message_id = excluded.message_id,
      projection_job_id = excluded.projection_job_id,
      attempt_count = excluded.attempt_count,
      last_attempt_at = excluded.last_attempt_at,
      last_error = excluded.last_error,
      sent_at = excluded.sent_at,
      projected_at = excluded.projected_at,
      delivery_metadata_json = excluded.delivery_metadata_json,
      updated_at = excluded.updated_at`
  )
    .bind(
      row.id,
      row.campaign_id,
      row.target_snapshot_id,
      row.delivery_status,
      row.thread_id,
      row.draft_id,
      row.message_id,
      row.projection_job_id,
      row.attempt_count,
      row.last_attempt_at,
      row.last_error,
      row.sent_at,
      row.projected_at,
      row.delivery_metadata_json,
      row.created_at,
      row.updated_at,
    )
    .run();

  const delivery = await getPrimeMessageCampaignDelivery(db, input.id);
  if (!delivery) {
    throw new Error(`Prime campaign delivery ${input.id} not found after upsert`);
  }

  return delivery;
}

export async function updatePrimeMessageCampaignDelivery(
  db: D1Database,
  input: UpdatePrimeMessageCampaignDeliveryInput,
): Promise<PrimeMessageCampaignDeliveryRow | null> {
  const updatedAt = input.updatedAt ?? Date.now();

  await db.prepare(
    `UPDATE message_campaign_deliveries
     SET delivery_status = ?,
         thread_id = ?,
         draft_id = ?,
         message_id = ?,
         projection_job_id = ?,
         attempt_count = ?,
         last_attempt_at = ?,
         last_error = ?,
         sent_at = ?,
         projected_at = ?,
         delivery_metadata_json = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      input.deliveryStatus,
      input.threadId ?? null,
      input.draftId ?? null,
      input.messageId ?? null,
      input.projectionJobId ?? null,
      input.attemptCount ?? 0,
      input.lastAttemptAt ?? null,
      input.lastError ?? null,
      input.sentAt ?? null,
      input.projectedAt ?? null,
      stringifyJson(input.deliveryMetadata ?? null),
      updatedAt,
      input.deliveryId,
    )
    .run();

  return getPrimeMessageCampaignDelivery(db, input.deliveryId);
}

export async function getPrimeMessageThreadRecord(
  db: D1Database,
  threadId: string,
): Promise<PrimeMessageThreadRecord | null> {
  const thread = await getPrimeMessageThread(db, threadId);

  if (!thread) {
    return null;
  }

  const [messagesResult, draftsResult, admissionsResult, projectionJobsResult, campaignsResult] = await Promise.all([
    db.prepare('SELECT * FROM message_records WHERE thread_id = ? ORDER BY created_at ASC, id ASC')
      .bind(threadId)
      .all<PrimeMessageRecordRow>(),
    db.prepare('SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC')
      .bind(threadId)
      .all<PrimeMessageDraftRow>(),
    db.prepare('SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC')
      .bind(threadId)
      .all<PrimeMessageAdmissionRow>(),
    db.prepare('SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC')
      .bind(threadId)
      .all<PrimeMessageProjectionJobRow>(),
    db.prepare('SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC')
      .bind(threadId)
      .all<PrimeMessageCampaignRow>(),
  ]);

  return {
    thread,
    messages: decodeRows(messagesResult),
    drafts: decodeRows(draftsResult),
    admissions: decodeRows(admissionsResult),
    projectionJobs: decodeRows(projectionJobsResult),
    campaigns: decodeRows(campaignsResult),
  };
}

export async function listPrimePendingProjectionJobs(
  db: D1Database,
  limit: number = 50,
): Promise<PrimeMessageProjectionJobRow[]> {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 200));
  const result = await db
    .prepare(
      `SELECT * FROM message_projection_jobs
       WHERE status = 'pending'
       ORDER BY updated_at ASC, created_at ASC
       LIMIT ?`
    )
    .bind(safeLimit)
    .all<PrimeMessageProjectionJobRow>();

  return decodeRows(result);
}

export async function listPrimeReviewThreads(
  db: D1Database,
  limit: number = 50,
  statusFilter?: PrimeReviewStatus,
): Promise<PrimeReviewThreadListRow[]> {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 200));

  const whereClause = statusFilter != null
    ? `WHERE t.review_status = ?`
    : `WHERE t.review_status NOT IN ('resolved', 'sent', 'auto_archived')`;

  const query = `SELECT
         t.*,
         latest_message.content AS latest_message_content,
         latest_message.kind AS latest_message_kind,
         latest_admission.decision AS latest_admission_decision,
         latest_admission.reason AS latest_admission_reason,
         latest_admission.source AS latest_admission_source,
         latest_admission.created_at AS latest_admission_created_at
       FROM message_threads t
       LEFT JOIN message_records latest_message
         ON latest_message.id = (
           SELECT mr.id
           FROM message_records mr
           WHERE mr.thread_id = t.id
           ORDER BY mr.created_at DESC, mr.id DESC
           LIMIT 1
         )
       LEFT JOIN message_admissions latest_admission
         ON latest_admission.id = (
           SELECT ma.id
           FROM message_admissions ma
           WHERE ma.thread_id = t.id
           ORDER BY ma.created_at DESC, ma.id DESC
           LIMIT 1
         )
       ${whereClause}
       ORDER BY t.updated_at DESC, t.created_at DESC
       LIMIT ?`;

  const stmt = statusFilter != null
    ? db.prepare(query).bind(statusFilter, safeLimit)
    : db.prepare(query).bind(safeLimit);

  const result = await stmt.all<PrimeReviewThreadListRow>();

  return decodeRows(result);
}

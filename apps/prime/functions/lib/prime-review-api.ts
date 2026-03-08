import type { D1Database } from '@acme/platform-core/d1';

import type { MessageKind } from '../../src/types/messenger/chat';

import {
  getPrimeMessageThreadRecord,
  listPrimeReviewThreads,
  type PrimeMessageAdmissionRow,
  type PrimeMessageCampaignRow,
  type PrimeMessageDraftRow,
  type PrimeMessageRecordRow,
  type PrimeMessageThreadRecord,
  type PrimeMessageThreadRow,
  type PrimeReviewStatus,
  type PrimeReviewThreadListRow,
} from './prime-messaging-repositories';
import {
  getPrimeReviewCampaignDetail,
  type PrimeReviewCampaignDetail,
  type PrimeReviewCampaignSummary,
  serializePrimeReviewCampaignSummary,
} from './prime-review-campaigns';

export type PrimeReviewChannel = 'prime_direct' | 'prime_broadcast';
export type PrimeReviewLane = 'support' | 'promotion';

export type PrimeReviewThreadSummary = {
  id: string;
  channel: PrimeReviewChannel;
  lane: PrimeReviewLane;
  reviewStatus: PrimeReviewStatus;
  subject: string | null;
  snippet: string | null;
  latestMessageAt: string | null;
  updatedAt: string;
  latestAdmissionDecision: string | null;
  latestAdmissionReason: string | null;
  bookingId: string;
};

export type PrimeReviewMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  senderId: string;
  senderName: string | null;
  senderRole: PrimeMessageRecordRow['sender_role'];
  content: string;
  kind: MessageKind;
  createdAt: string;
};

export type PrimeReviewAdmission = {
  id: number;
  decision: string;
  reason: string | null;
  source: string;
  classifierVersion: string | null;
  sourceMetadataJson: string | null;
  createdAt: string;
};

export type PrimeReviewDraft = {
  id: string;
  status: PrimeMessageDraftRow['status'];
  source: PrimeMessageDraftRow['source'];
  content: string;
  kind: PrimeMessageDraftRow['kind'];
  audience: PrimeMessageDraftRow['audience'];
  quality: Record<string, unknown> | null;
  interpret: Record<string, unknown> | null;
  createdByUid: string | null;
  reviewerUid: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrimeReviewThreadDetail = {
  thread: PrimeReviewThreadSummary & {
    takeoverState: PrimeMessageThreadRow['takeover_state'];
    suppressionReason: string | null;
    memberUids: string[];
  };
  messages: PrimeReviewMessage[];
  admissions: PrimeReviewAdmission[];
  currentDraft: PrimeReviewDraft | null;
  currentCampaign: PrimeReviewCampaignDetail | null;
  metadata: Record<string, unknown>;
};

function toIsoTimestamp(value: number | null): string | null {
  return typeof value === 'number' ? new Date(value).toISOString() : null;
}

function parseMemberUids(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function resolveChannel(thread: Pick<PrimeMessageThreadRow, 'channel_type'>): PrimeReviewChannel {
  return thread.channel_type === 'broadcast' ? 'prime_broadcast' : 'prime_direct';
}

function resolveLane(channel: PrimeReviewChannel): PrimeReviewLane {
  return channel === 'prime_broadcast' ? 'promotion' : 'support';
}

function defaultSubject(row: Pick<PrimeMessageThreadRow, 'channel_type' | 'booking_id' | 'title'>): string {
  if (row.title?.trim()) {
    return row.title.trim();
  }

  return row.channel_type === 'broadcast'
    ? `Prime broadcast ${row.booking_id}`
    : `Prime guest chat ${row.booking_id}`;
}

function serializeSummary(row: PrimeReviewThreadListRow): PrimeReviewThreadSummary {
  const channel = resolveChannel(row);

  return {
    id: row.id,
    channel,
    lane: resolveLane(channel),
    reviewStatus: row.review_status,
    subject: defaultSubject(row),
    snippet: row.latest_message_content,
    latestMessageAt: toIsoTimestamp(row.latest_message_at),
    updatedAt: new Date(row.updated_at).toISOString(),
    latestAdmissionDecision: row.latest_admission_decision,
    latestAdmissionReason: row.latest_admission_reason,
    bookingId: row.booking_id,
  };
}

function serializeMessage(message: PrimeMessageRecordRow): PrimeReviewMessage {
  return {
    id: message.id,
    direction: message.sender_role === 'guest' ? 'inbound' : 'outbound',
    senderId: message.sender_id,
    senderName: message.sender_name,
    senderRole: message.sender_role,
    content: message.content,
    kind: message.kind,
    createdAt: new Date(message.created_at).toISOString(),
  };
}

function serializeAdmission(admission: PrimeMessageAdmissionRow): PrimeReviewAdmission {
  return {
    id: admission.id,
    decision: admission.decision,
    reason: admission.reason,
    source: admission.source,
    classifierVersion: admission.classifier_version,
    sourceMetadataJson: admission.source_metadata_json,
    createdAt: new Date(admission.created_at).toISOString(),
  };
}

function resolveCurrentDraft(drafts: PrimeMessageDraftRow[]): PrimeMessageDraftRow | null {
  return drafts.find((draft) => draft.status !== 'dismissed' && draft.status !== 'sent') ?? null;
}

function resolveCurrentCampaign(
  campaigns: PrimeMessageCampaignRow[],
): PrimeMessageCampaignRow | null {
  return campaigns.find((campaign) =>
    campaign.status === 'drafting' || campaign.status === 'under_review',
  ) ?? campaigns[0] ?? null;
}

export function serializePrimeReviewDraft(draft: PrimeMessageDraftRow): PrimeReviewDraft {
  return {
    id: draft.id,
    status: draft.status,
    source: draft.source,
    content: draft.content,
    kind: draft.kind,
    audience: draft.audience,
    quality: parseMetadata(draft.quality_json),
    interpret: parseMetadata(draft.interpret_json),
    createdByUid: draft.created_by_uid,
    reviewerUid: draft.reviewer_uid,
    createdAt: new Date(draft.created_at).toISOString(),
    updatedAt: new Date(draft.updated_at).toISOString(),
  };
}

type PrimeMessageThreadRecordWithDb = PrimeMessageThreadRecord & {
  db: D1Database;
};

async function buildDetail(record: PrimeMessageThreadRecordWithDb): Promise<PrimeReviewThreadDetail> {
  const channel = resolveChannel(record.thread);
  const currentDraft = resolveCurrentDraft(record.drafts);
  const currentCampaign = resolveCurrentCampaign(record.campaigns);
  const summary: PrimeReviewThreadSummary = {
    id: record.thread.id,
    channel,
    lane: resolveLane(channel),
    reviewStatus: record.thread.review_status,
    subject: defaultSubject(record.thread),
    snippet: record.messages.at(-1)?.content ?? null,
    latestMessageAt: toIsoTimestamp(record.thread.latest_message_at),
    updatedAt: new Date(record.thread.updated_at).toISOString(),
    latestAdmissionDecision: record.admissions[0]?.decision ?? null,
    latestAdmissionReason: record.admissions[0]?.reason ?? null,
    bookingId: record.thread.booking_id,
  };

  return {
    thread: {
      ...summary,
      takeoverState: record.thread.takeover_state,
      suppressionReason: record.thread.suppression_reason,
      memberUids: parseMemberUids(record.thread.member_uids_json),
    },
    messages: record.messages.map(serializeMessage),
    admissions: record.admissions.map(serializeAdmission),
    currentDraft: currentDraft ? serializePrimeReviewDraft(currentDraft) : null,
    currentCampaign: currentCampaign
      ? await getPrimeReviewCampaignDetail(
          // Thread detail already loaded this campaign list from the same DB query path.
          // The extra fetch hydrates target/delivery detail for the canonical operator API.
          record.db,
          currentCampaign.id,
        )
      : null,
    metadata: parseMetadata(record.thread.metadata_json),
  };
}

export async function listPrimeReviewThreadSummaries(
  db: D1Database,
  limit: number = 50,
): Promise<PrimeReviewThreadSummary[]> {
  const rows = await listPrimeReviewThreads(db, limit);
  return rows.map(serializeSummary);
}

export async function getPrimeReviewThreadDetail(
  db: D1Database,
  threadId: string,
): Promise<PrimeReviewThreadDetail | null> {
  const record = await getPrimeMessageThreadRecord(db, threadId);
  return record ? buildDetail({ ...record, db }) : null;
}

export type PrimeReviewCampaign = PrimeReviewCampaignSummary;
export { serializePrimeReviewCampaignSummary };

import type { D1Database } from '@acme/platform-core/d1';

import {
  createPrimeMessageDraft,
  getPrimeMessageThreadRecord,
  recordPrimeMessageAdmission,
  updatePrimeMessageDraft,
  upsertPrimeMessageThread,
} from './prime-messaging-repositories';
import {
  getPrimeReviewThreadDetail,
  type PrimeReviewThreadDetail,
} from './prime-review-api';
import {
  ensureWholeHostelCampaignForDraft,
  isWholeHostelBroadcastThread,
} from './prime-whole-hostel-campaigns';

export type SavePrimeReviewDraftResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | { outcome: 'updated'; detail: PrimeReviewThreadDetail };

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

function parseStringArray(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : null;
  } catch {
    return null;
  }
}

function buildDraftId(now: number): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `draft_${now}_${suffix}`;
}

export async function savePrimeReviewDraft(
  db: D1Database,
  input: {
    threadId: string;
    actorUid: string;
    content: string;
    occurredAt?: number;
  },
): Promise<SavePrimeReviewDraftResult> {
  const record = await getPrimeMessageThreadRecord(db, input.threadId);
  if (!record) {
    return { outcome: 'not_found' };
  }

  const isReusableWholeHostelLane = isWholeHostelBroadcastThread(record.thread);

  if (!isReusableWholeHostelLane && record.thread.review_status === 'resolved') {
    return { outcome: 'conflict', message: 'Prime review thread is already resolved' };
  }
  if (!isReusableWholeHostelLane && record.thread.review_status === 'auto_archived') {
    return { outcome: 'conflict', message: 'Prime review thread is already archived' };
  }
  if (!isReusableWholeHostelLane && record.thread.review_status === 'sent') {
    return { outcome: 'conflict', message: 'Prime review thread is already sent' };
  }

  const occurredAt = input.occurredAt ?? Date.now();
  const activeStaffDraft = record.drafts.find((draft) =>
    draft.source === 'staff' && draft.status !== 'dismissed' && draft.status !== 'sent',
  );

  const draft = activeStaffDraft
    ? await updatePrimeMessageDraft(db, {
        draftId: activeStaffDraft.id,
        status: 'under_review',
        content: input.content,
        createdByUid: activeStaffDraft.created_by_uid ?? input.actorUid,
        reviewerUid: input.actorUid,
        updatedAt: occurredAt,
      })
    : await createPrimeMessageDraft(db, {
        id: buildDraftId(occurredAt),
        threadId: input.threadId,
        status: 'under_review',
        source: 'staff',
        content: input.content,
        audience: record.thread.audience,
        createdByUid: input.actorUid,
        reviewerUid: input.actorUid,
        createdAt: occurredAt,
      });

  if (!activeStaffDraft && draft) {
    await recordPrimeMessageAdmission(db, {
      threadId: input.threadId,
      draftId: draft.id,
      decision: 'draft_created',
      reason: 'staff_manual_draft',
      source: 'staff_review',
      sourceMetadata: {
        actorUid: input.actorUid,
        draftSource: 'staff',
      },
      createdAt: occurredAt,
    });
  }

  if (isReusableWholeHostelLane && draft) {
    await ensureWholeHostelCampaignForDraft(db, {
      thread: record.thread,
      draftId: draft.id,
      actorUid: input.actorUid,
      occurredAt,
    });

    await upsertPrimeMessageThread(db, {
      id: record.thread.id,
      bookingId: record.thread.booking_id,
      channelType: record.thread.channel_type,
      audience: record.thread.audience,
      memberUids: parseStringArray(record.thread.member_uids_json),
      title: record.thread.title,
      latestMessageAt: record.thread.latest_message_at,
      latestInboundMessageAt: record.thread.latest_inbound_message_at,
      lastStaffReplyAt: record.thread.last_staff_reply_at,
      takeoverState: 'staff_active',
      reviewStatus: 'pending',
      suppressionReason: record.thread.suppression_reason,
      metadata: parseJsonObject(record.thread.metadata_json),
      createdAt: record.thread.created_at,
      updatedAt: occurredAt,
    });
  }

  const detail = await getPrimeReviewThreadDetail(db, input.threadId);
  if (!detail) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'updated',
    detail,
  };
}

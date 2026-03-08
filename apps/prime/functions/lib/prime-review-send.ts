import type { D1Database } from '@acme/platform-core/d1';

import type { FirebaseEnv } from './firebase-rest';
import {
  createPrimeMessage,
  enqueuePrimeProjectionJob,
  getPrimeMessageThreadRecord,
  type PrimeMessageDraftRow,
  type PrimeMessageRecordRow,
  recordPrimeMessageAdmission,
  updatePrimeMessageDraft,
  upsertPrimeMessageThread,
} from './prime-messaging-repositories';
import {
  getPrimeReviewThreadDetail,
  type PrimeReviewCampaign,
  type PrimeReviewDraft,
  type PrimeReviewThreadSummary,
  serializePrimeReviewDraft,
} from './prime-review-api';
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
import {
  buildWholeHostelCampaignId,
  getLatestWholeHostelCampaign,
  isWholeHostelBroadcastThread,
  markWholeHostelCampaignSent,
  recordWholeHostelCampaignDelivery,
} from './prime-whole-hostel-campaigns';

export type SendPrimeReviewThreadResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | {
      outcome: 'sent';
      thread: PrimeReviewThreadSummary;
      draft: PrimeReviewDraft;
      campaign: PrimeReviewCampaign | null;
      sentMessageId: string;
    };

export async function sendPrimeReviewThread(
  db: D1Database,
  env: FirebaseEnv,
  input: {
    threadId: string;
    actorUid: string;
    actorSource: string;
    occurredAt?: number;
  },
): Promise<SendPrimeReviewThreadResult> {
  const record = await getPrimeMessageThreadRecord(db, input.threadId);
  if (!record) {
    return { outcome: 'not_found' };
  }

  const conflictMessage = buildThreadSendConflictMessage(record.thread);
  if (conflictMessage) {
    return { outcome: 'conflict', message: conflictMessage };
  }

  const currentDraft = getCurrentReviewDraft(record.drafts);
  if (!currentDraft) {
    return { outcome: 'conflict', message: 'Prime review thread has no draft to send' };
  }

  const occurredAt = input.occurredAt ?? Date.now();
  const messageId = buildReviewMessageId(occurredAt);
  const links = parseLinks(currentDraft.links_json);
  const attachments = parseAttachments(currentDraft.attachments_json);
  const cards = parseCards(currentDraft.cards_json);
  const messageKind = resolveSentMessageKind(record.thread);
  const existingWholeHostelCampaign = isWholeHostelBroadcastThread(record.thread)
    ? await getLatestWholeHostelCampaign(db, record.thread.id)
    : null;
  const campaignId = existingWholeHostelCampaign?.id
    ?? (isWholeHostelBroadcastThread(record.thread) ? buildWholeHostelCampaignId(occurredAt) : null);

  const projectedMessage: PrimeMessageRecordRow = {
    id: messageId,
    thread_id: record.thread.id,
    sender_id: input.actorUid,
    sender_role: 'staff',
    sender_name: 'Reception',
    content: currentDraft.content,
    kind: messageKind,
    audience: record.thread.audience,
    links_json: JSON.stringify(links ?? null),
    attachments_json: JSON.stringify(attachments ?? null),
    cards_json: JSON.stringify(cards ?? null),
    campaign_id: campaignId,
    draft_id: currentDraft.id,
    deleted: 0,
    created_at: occurredAt,
  };

  const projectedDraft: PrimeMessageDraftRow = {
    ...currentDraft,
    status: 'sent',
    reviewer_uid: input.actorUid,
    sent_message_id: messageId,
    updated_at: occurredAt,
  };

  await projectPrimeThreadMessageToFirebase(env, {
    thread: record.thread,
    message: projectedMessage,
    draft: projectedDraft,
    occurredAt,
  });

  await createPrimeMessage(db, {
    id: messageId,
    threadId: record.thread.id,
    senderId: input.actorUid,
    senderRole: 'staff',
    senderName: 'Reception',
    content: currentDraft.content,
    kind: messageKind,
    audience: record.thread.audience,
    links,
    attachments,
    cards,
    campaignId,
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
    sentMessageId: messageId,
    updatedAt: occurredAt,
  });
  if (!sentDraft) {
    return { outcome: 'not_found' };
  }

  await upsertPrimeMessageThread(db, {
    id: record.thread.id,
    bookingId: record.thread.booking_id,
    channelType: record.thread.channel_type,
    audience: record.thread.audience,
    memberUids: parseStringArray(record.thread.member_uids_json),
    title: record.thread.title,
    latestMessageAt: occurredAt,
    latestInboundMessageAt: record.thread.latest_inbound_message_at,
    lastStaffReplyAt: occurredAt,
    takeoverState: 'staff_active',
    reviewStatus: 'sent',
    suppressionReason: record.thread.suppression_reason,
    metadata: parseJsonObject(record.thread.metadata_json),
    createdAt: record.thread.created_at,
    updatedAt: occurredAt,
  });

  const _campaign = isWholeHostelBroadcastThread(record.thread)
    ? await markWholeHostelCampaignSent(db, {
        thread: record.thread,
        campaignId,
        draftId: currentDraft.id,
        sentMessageId: messageId,
        actorUid: input.actorUid,
        occurredAt,
      })
    : null;

  await recordPrimeMessageAdmission(db, {
    threadId: record.thread.id,
    draftId: currentDraft.id,
    decision: 'sent',
    reason: resolveSentAdmissionReason(record.thread),
    source: 'staff_review',
    sourceMetadata: {
      actorUid: input.actorUid,
      actorSource: input.actorSource,
      messageId,
      projectionTarget: 'firebase',
    },
    createdAt: occurredAt,
  });

  const projectionJobId = `proj_message_${messageId}`;

  await enqueuePrimeProjectionJob(db, {
    id: projectionJobId,
    threadId: record.thread.id,
    entityType: 'message',
    entityId: messageId,
    status: 'projected',
    attemptCount: 1,
    lastAttemptAt: occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  });

  if (_campaign) {
    await recordWholeHostelCampaignDelivery(db, {
      campaignId: _campaign.id,
      thread: record.thread,
      draftId: currentDraft.id,
      sentMessageId: messageId,
      projectionJobId,
      occurredAt,
    });
  }

  const detail = await getPrimeReviewThreadDetail(db, record.thread.id);
  if (!detail) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'sent',
    thread: detail.thread,
    draft: serializePrimeReviewDraft(sentDraft),
    campaign: detail.currentCampaign,
    sentMessageId: messageId,
  };
}

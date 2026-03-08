import type { D1Database } from '@acme/platform-core/d1';

import type { FirebaseEnv } from './firebase-rest';
import {
  getPrimeMessage,
  getPrimeMessageCampaignRecord,
  getPrimeMessageDraft,
  getPrimeMessageThread,
  getPrimeMessageThreadRecord,
  type PrimeMessageCampaignDeliveryRow,
  updatePrimeMessageCampaign,
  updatePrimeMessageCampaignDelivery,
  updatePrimeProjectionJob,
} from './prime-messaging-repositories';
import { sendPrimeExpandedCampaign } from './prime-review-campaign-runtime';
import { getPrimeReviewCampaignDetail, type PrimeReviewCampaignDetail } from './prime-review-campaigns';
import { sendPrimeReviewThread } from './prime-review-send';
import { projectPrimeThreadMessageToFirebase } from './prime-thread-projection';

export type SendPrimeReviewCampaignResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | { outcome: 'sent'; campaign: PrimeReviewCampaignDetail; sentMessageId: string };

export type ReplayPrimeReviewCampaignDeliveryResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | { outcome: 'replayed'; campaign: PrimeReviewCampaignDetail; deliveryId: string };

function truncateErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 500 ? message.slice(0, 500) : message;
}

function computeCampaignCounters(deliveries: PrimeMessageCampaignDeliveryRow[]) {
  return deliveries.reduce(
    (accumulator, delivery) => {
      if (delivery.delivery_status === 'sent' || delivery.delivery_status === 'projected') {
        accumulator.sentCount += 1;
      }
      if (delivery.delivery_status === 'projected') {
        accumulator.projectedCount += 1;
      }
      if (delivery.delivery_status === 'failed') {
        accumulator.failedCount += 1;
        accumulator.lastError ??= delivery.last_error;
      }

      return accumulator;
    },
    {
      targetCount: deliveries.length,
      sentCount: 0,
      projectedCount: 0,
      failedCount: 0,
      lastError: null as string | null,
    },
  );
}

export async function sendPrimeReviewCampaign(
  db: D1Database,
  env: FirebaseEnv,
  input: {
    campaignId: string;
    actorUid: string;
    actorSource: string;
    occurredAt?: number;
  },
): Promise<SendPrimeReviewCampaignResult> {
  const campaign = await getPrimeReviewCampaignDetail(db, input.campaignId);
  if (!campaign) {
    return { outcome: 'not_found' };
  }

  if (campaign.audience === 'booking' || campaign.audience === 'room') {
    const threadRecord = await getPrimeMessageThreadRecord(db, campaign.threadId);
    if (!threadRecord) {
      return { outcome: 'not_found' };
    }

    return sendPrimeExpandedCampaign(db, env, {
      threadRecord,
      campaign: {
        id: campaign.id,
        thread_id: campaign.threadId,
        campaign_type: campaign.type,
        audience: campaign.audience,
        status: campaign.status,
        title: campaign.title,
        metadata_json: JSON.stringify(campaign.metadata ?? null),
        latest_draft_id: campaign.latestDraftId,
        sent_message_id: campaign.sentMessageId,
        target_count: campaign.targetCount,
        sent_count: campaign.sentCount,
        projected_count: campaign.projectedCount,
        failed_count: campaign.failedCount,
        last_error: campaign.lastError,
        created_by_uid: campaign.createdByUid,
        reviewer_uid: campaign.reviewerUid,
        created_at: Date.parse(campaign.createdAt),
        updated_at: Date.parse(campaign.updatedAt),
      },
      actorUid: input.actorUid,
      actorSource: input.actorSource,
      occurredAt: input.occurredAt,
    });
  }

  const result = await sendPrimeReviewThread(db, env, {
    threadId: campaign.threadId,
    actorUid: input.actorUid,
    actorSource: input.actorSource,
    occurredAt: input.occurredAt,
  });

  if (result.outcome !== 'sent') {
    return result;
  }

  const updatedCampaign = result.campaign?.id
    ? await getPrimeReviewCampaignDetail(db, result.campaign.id)
    : await getPrimeReviewCampaignDetail(db, input.campaignId);

  if (!updatedCampaign) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'sent',
    campaign: updatedCampaign,
    sentMessageId: result.sentMessageId,
  };
}

export async function replayPrimeReviewCampaignDelivery(
  db: D1Database,
  env: FirebaseEnv,
  input: {
    campaignId: string;
    deliveryId: string;
    occurredAt?: number;
  },
): Promise<ReplayPrimeReviewCampaignDeliveryResult> {
  const record = await getPrimeMessageCampaignRecord(db, input.campaignId);
  if (!record) {
    return { outcome: 'not_found' };
  }

  const delivery = record.deliveries.find((entry) => entry.id === input.deliveryId) ?? null;
  if (!delivery) {
    return { outcome: 'not_found' };
  }

  if (!delivery.message_id) {
    return {
      outcome: 'conflict',
      message: 'Prime campaign delivery has no message to replay',
    };
  }

  if (!delivery.thread_id) {
    return {
      outcome: 'conflict',
      message: 'Prime campaign delivery has no thread to replay',
    };
  }

  const [thread, message] = await Promise.all([
    getPrimeMessageThread(db, delivery.thread_id),
    getPrimeMessage(db, delivery.message_id),
  ]);
  if (!thread || !message) {
    return { outcome: 'not_found' };
  }

  const draft = message.draft_id ? await getPrimeMessageDraft(db, message.draft_id) : null;
  const occurredAt = input.occurredAt ?? Date.now();
  const attemptCount = delivery.attempt_count + 1;

  try {
    await projectPrimeThreadMessageToFirebase(env, {
      thread,
      message,
      draft,
      occurredAt,
    });

    const updatedDelivery = await updatePrimeMessageCampaignDelivery(db, {
      deliveryId: delivery.id,
      deliveryStatus: 'projected',
      threadId: delivery.thread_id,
      draftId: delivery.draft_id,
      messageId: delivery.message_id,
      projectionJobId: delivery.projection_job_id,
      attemptCount,
      lastAttemptAt: occurredAt,
      lastError: null,
      sentAt: delivery.sent_at ?? occurredAt,
      projectedAt: occurredAt,
      deliveryMetadata: delivery.delivery_metadata_json
        ? JSON.parse(delivery.delivery_metadata_json) as Record<string, unknown>
        : null,
      updatedAt: occurredAt,
    });
    if (!updatedDelivery) {
      return { outcome: 'not_found' };
    }

    if (delivery.projection_job_id) {
      await updatePrimeProjectionJob(db, {
        jobId: delivery.projection_job_id,
        status: 'projected',
        attemptCount,
        lastAttemptAt: occurredAt,
        lastError: null,
        updatedAt: occurredAt,
      });
    }

    const counters = computeCampaignCounters(
      record.deliveries.map((entry) => (entry.id === updatedDelivery.id ? updatedDelivery : entry)),
    );

    await updatePrimeMessageCampaign(db, {
      campaignId: record.campaign.id,
      status: record.campaign.status,
      title: record.campaign.title,
      metadata: record.campaign.metadata_json
        ? JSON.parse(record.campaign.metadata_json) as Record<string, unknown>
        : null,
      latestDraftId: record.campaign.latest_draft_id,
      sentMessageId: record.campaign.sent_message_id,
      targetCount: Math.max(record.targets.length, counters.targetCount),
      sentCount: counters.sentCount,
      projectedCount: counters.projectedCount,
      failedCount: counters.failedCount,
      lastError: counters.lastError,
      createdByUid: record.campaign.created_by_uid,
      reviewerUid: record.campaign.reviewer_uid,
      updatedAt: occurredAt,
    });

    const campaign = await getPrimeReviewCampaignDetail(db, record.campaign.id);
    if (!campaign) {
      return { outcome: 'not_found' };
    }

    return {
      outcome: 'replayed',
      campaign,
      deliveryId: updatedDelivery.id,
    };
  } catch (error) {
    const lastError = truncateErrorMessage(error);

    await updatePrimeMessageCampaignDelivery(db, {
      deliveryId: delivery.id,
      deliveryStatus: 'failed',
      threadId: delivery.thread_id,
      draftId: delivery.draft_id,
      messageId: delivery.message_id,
      projectionJobId: delivery.projection_job_id,
      attemptCount,
      lastAttemptAt: occurredAt,
      lastError,
      sentAt: delivery.sent_at,
      projectedAt: delivery.projected_at,
      deliveryMetadata: delivery.delivery_metadata_json
        ? JSON.parse(delivery.delivery_metadata_json) as Record<string, unknown>
        : null,
      updatedAt: occurredAt,
    });

    if (delivery.projection_job_id) {
      await updatePrimeProjectionJob(db, {
        jobId: delivery.projection_job_id,
        status: 'failed',
        attemptCount,
        lastAttemptAt: occurredAt,
        lastError,
        updatedAt: occurredAt,
      });
    }

    const failedCounters = computeCampaignCounters(
      record.deliveries.map((entry) => entry.id === delivery.id
        ? {
            ...entry,
            delivery_status: 'failed',
            attempt_count: attemptCount,
            last_attempt_at: occurredAt,
            last_error: lastError,
            updated_at: occurredAt,
          }
        : entry),
    );

    await updatePrimeMessageCampaign(db, {
      campaignId: record.campaign.id,
      status: record.campaign.status,
      title: record.campaign.title,
      metadata: record.campaign.metadata_json
        ? JSON.parse(record.campaign.metadata_json) as Record<string, unknown>
        : null,
      latestDraftId: record.campaign.latest_draft_id,
      sentMessageId: record.campaign.sent_message_id,
      targetCount: Math.max(record.targets.length, failedCounters.targetCount),
      sentCount: failedCounters.sentCount,
      projectedCount: failedCounters.projectedCount,
      failedCount: failedCounters.failedCount,
      lastError: failedCounters.lastError,
      createdByUid: record.campaign.created_by_uid,
      reviewerUid: record.campaign.reviewer_uid,
      updatedAt: occurredAt,
    });

    throw error;
  }
}

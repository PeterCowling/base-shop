import type { D1Database } from '@acme/platform-core/d1';

import {
  getPrimeMessageThread,
  type PrimeMessageAdmissionDecision,
  type PrimeReviewStatus,
  recordPrimeMessageAdmission,
  updatePrimeMessageThreadReviewStatus,
} from './prime-messaging-repositories';
import {
  getPrimeReviewThreadDetail,
  type PrimeReviewThreadSummary,
} from './prime-review-api';
import {
  isWholeHostelBroadcastThread,
  markWholeHostelCampaignReviewState,
} from './prime-whole-hostel-campaigns';

export type PrimeReviewAction = 'resolve' | 'dismiss';

export type MutatePrimeReviewThreadResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | { outcome: 'updated'; thread: PrimeReviewThreadSummary };

type PrimeReviewActionConfig = {
  targetStatus: PrimeReviewStatus;
  admissionDecision: PrimeMessageAdmissionDecision;
  reason: string;
};

const ACTION_CONFIG: Record<PrimeReviewAction, PrimeReviewActionConfig> = {
  resolve: {
    targetStatus: 'resolved',
    admissionDecision: 'resolved',
    reason: 'staff_resolved',
  },
  dismiss: {
    targetStatus: 'auto_archived',
    admissionDecision: 'dismissed',
    reason: 'staff_not_relevant',
  },
};

function buildConflictMessage(
  action: PrimeReviewAction,
  currentStatus: PrimeReviewStatus,
): string | null {
  if (action === 'resolve') {
    if (currentStatus === 'resolved') {
      return 'Prime review thread is already resolved';
    }
    if (currentStatus === 'auto_archived') {
      return 'Prime review thread is already archived';
    }
    if (currentStatus === 'sent') {
      return 'Prime review thread is already sent';
    }
  }

  if (action === 'dismiss') {
    if (currentStatus === 'auto_archived') {
      return 'Prime review thread is already archived';
    }
    if (currentStatus === 'resolved') {
      return 'Prime review thread is already resolved';
    }
    if (currentStatus === 'sent') {
      return 'Prime review thread is already sent';
    }
  }

  return null;
}

export async function mutatePrimeReviewThread(
  db: D1Database,
  input: {
    action: PrimeReviewAction;
    threadId: string;
    actorUid: string;
    actorSource: string;
    occurredAt?: number;
  },
): Promise<MutatePrimeReviewThreadResult> {
  const existingThread = await getPrimeMessageThread(db, input.threadId);
  if (!existingThread) {
    return { outcome: 'not_found' };
  }

  const conflictMessage = buildConflictMessage(input.action, existingThread.review_status);
  if (conflictMessage) {
    return {
      outcome: 'conflict',
      message: conflictMessage,
    };
  }

  const config = ACTION_CONFIG[input.action];
  const occurredAt = input.occurredAt ?? Date.now();

  await updatePrimeMessageThreadReviewStatus(db, {
    threadId: input.threadId,
    reviewStatus: config.targetStatus,
    updatedAt: occurredAt,
  });

  await recordPrimeMessageAdmission(db, {
    threadId: input.threadId,
    decision: config.admissionDecision,
    reason: config.reason,
    source: 'staff_review',
    sourceMetadata: {
      actorUid: input.actorUid,
      actorSource: input.actorSource,
      action: input.action,
      previousReviewStatus: existingThread.review_status,
    },
    createdAt: occurredAt,
  });

  if (isWholeHostelBroadcastThread(existingThread)) {
    await markWholeHostelCampaignReviewState(db, {
      thread: existingThread,
      actorUid: input.actorUid,
      occurredAt,
      status: input.action === 'resolve' ? 'resolved' : 'archived',
    });
  }

  const detail = await getPrimeReviewThreadDetail(db, input.threadId);
  if (!detail) {
    return { outcome: 'not_found' };
  }

  return {
    outcome: 'updated',
    thread: detail.thread,
  };
}

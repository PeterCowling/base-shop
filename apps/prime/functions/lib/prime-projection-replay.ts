import type { D1Database } from '@acme/platform-core/d1';

import type { FirebaseEnv } from './firebase-rest';
import {
  getPrimeMessage,
  getPrimeMessageDraft,
  getPrimeMessageThread,
  getPrimeProjectionJob,
  type PrimeMessageProjectionJobRow,
  updatePrimeProjectionJob,
} from './prime-messaging-repositories';
import { projectPrimeThreadMessageToFirebase } from './prime-thread-projection';

export type ReplayPrimeProjectionJobResult =
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; message: string }
  | {
      outcome: 'replayed';
      job: PrimeMessageProjectionJobRow;
    };

function truncateErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 500 ? message.slice(0, 500) : message;
}

function buildConflictMessage(job: PrimeMessageProjectionJobRow): string | null {
  if (job.projection_target !== 'firebase') {
    return `Projection target ${job.projection_target} is not supported`; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (job.entity_type !== 'message') {
    return `Projection entity ${job.entity_type} is not supported`; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (job.status === 'projected') {
    return 'Projection job is already projected'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  return null;
}

export async function replayPrimeProjectionJob(
  db: D1Database,
  env: FirebaseEnv,
  input: {
    jobId: string;
    occurredAt?: number;
  },
): Promise<ReplayPrimeProjectionJobResult> {
  const job = await getPrimeProjectionJob(db, input.jobId);
  if (!job) {
    return { outcome: 'not_found' };
  }

  const conflictMessage = buildConflictMessage(job);
  if (conflictMessage) {
    return { outcome: 'conflict', message: conflictMessage };
  }

  const [thread, message] = await Promise.all([
    getPrimeMessageThread(db, job.thread_id),
    getPrimeMessage(db, job.entity_id),
  ]);
  if (!thread || !message) {
    return { outcome: 'not_found' };
  }
  if (thread.channel_type !== 'direct') {
    return {
      outcome: 'conflict',
      message: 'Projection replay is only supported for direct threads', // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    };
  }

  const draft = message.draft_id ? await getPrimeMessageDraft(db, message.draft_id) : null;
  const occurredAt = input.occurredAt ?? Date.now();
  const attemptCount = job.attempt_count + 1;

  try {
    await projectPrimeThreadMessageToFirebase(env, {
      thread,
      message,
      draft,
      occurredAt,
    });

    const updatedJob = await updatePrimeProjectionJob(db, {
      jobId: job.id,
      status: 'projected',
      attemptCount,
      lastAttemptAt: occurredAt,
      lastError: null,
      updatedAt: occurredAt,
    });

    if (!updatedJob) {
      return { outcome: 'not_found' };
    }

    return {
      outcome: 'replayed',
      job: updatedJob,
    };
  } catch (error) {
    await updatePrimeProjectionJob(db, {
      jobId: job.id,
      status: 'failed',
      attemptCount,
      lastAttemptAt: occurredAt,
      lastError: truncateErrorMessage(error),
      updatedAt: occurredAt,
    });

    throw error;
  }
}

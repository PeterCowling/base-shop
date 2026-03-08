import {
  processArrival48HoursQueueRecord,
  type QueueProcessorDependencies,
  type QueueProcessorTransition,
} from '../../src/lib/messaging/queue-processor';
import {
  MessagingEventType,
  type MessagingQueueRecord,
  messagingQueueRecordSchema,
} from '../../src/lib/messaging/triggers';

import { createDefaultFunctionTranslator } from './function-i18n';

export interface MessagingQueueStore {
  get<T = unknown>(path: string): Promise<T | null>;
  update<T = unknown>(path: string, data: Partial<T>): Promise<void>;
  getWithEtag?<T = unknown>(path: string): Promise<{
    data: T | null;
    etag: string | null;
  }>;
  setIfMatch?<T = unknown>(
    path: string,
    data: T,
    etag: string,
  ): Promise<{
    applied: boolean;
    data: T | null;
    etag: string | null;
  }>;
}

export interface MessagingDispatcherDependencies extends QueueProcessorDependencies {
  queueStore: MessagingQueueStore;
}

export interface MessagingDispatcherResult {
  eventId: string;
  outcome: 'sent' | 'idempotent' | 'retry' | 'failed' | 'unsupported' | 'missing' | 'invalid';
  reason?: string;
  transition?: QueueProcessorTransition;
}

const PROCESSING_LEASE_TIMEOUT_MS = 15 * 60 * 1000;
const CLAIM_RETRY_LIMIT = 3;
const { t } = createDefaultFunctionTranslator('MessagingDispatcher');

function buildQueuePath(eventId: string): string {
  return `messagingQueue/${eventId}`;
}

function recoverStaleProcessingRecord(
  record: MessagingQueueRecord,
): MessagingQueueRecord {
  return {
    ...record,
    status: 'pending',
    lastError: t('errors.recoveredStaleProcessingLease'),
    processedAt: null,
  };
}

function buildClaimedProcessingRecord(
  record: MessagingQueueRecord,
  now: number,
): MessagingQueueRecord {
  return {
    ...record,
    status: 'processing',
    lastError: null,
    processedAt: now,
  };
}

function isAtomicClaimStore(
  store: MessagingQueueStore,
): store is Required<Pick<MessagingQueueStore, 'getWithEtag' | 'setIfMatch'>> &
  MessagingQueueStore {
  return typeof store.getWithEtag === 'function' && typeof store.setIfMatch === 'function';
}

export async function dispatchQueuedArrival48HoursEvent(
  eventId: string,
  dependencies: MessagingDispatcherDependencies,
): Promise<MessagingDispatcherResult> {
  const now = dependencies.now ?? Date.now;
  const queuePath = buildQueuePath(eventId);
  const atomicStore = isAtomicClaimStore(dependencies.queueStore)
    ? dependencies.queueStore
    : null;

  let rawRecord: unknown = null;
  let record: MessagingQueueRecord | null = null;

  if (atomicStore) {
    for (let attempt = 0; attempt < CLAIM_RETRY_LIMIT; attempt += 1) {
      const snapshot = await atomicStore.getWithEtag<unknown>(queuePath);
      rawRecord = snapshot.data;
      if (!rawRecord) {
        return {
          eventId,
          outcome: 'missing',
          reason: t('reasons.queueRecordMissing'),
        };
      }

      const parsedSnapshot = messagingQueueRecordSchema.safeParse(rawRecord);
      if (!parsedSnapshot.success) {
        await dependencies.queueStore.update(queuePath, {
          status: 'failed',
          retryCount: 1,
          lastError: t('errors.invalidQueueRecord'),
          processedAt: now(),
        });
        return {
          eventId,
          outcome: 'invalid',
          reason: t('reasons.invalidQueueRecord'),
        };
      }

      const parsedRecord = parsedSnapshot.data;
      if (parsedRecord.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
        return {
          eventId,
          outcome: 'unsupported',
          reason: `${t('reasons.unsupportedEventTypePrefix')}${parsedRecord.eventType}`,
        };
      }

      let recordToClaim = parsedRecord;
      if (parsedRecord.status === 'processing') {
        const processingStartedAt =
          typeof parsedRecord.processedAt === 'number'
            ? parsedRecord.processedAt
            : parsedRecord.createdAt;
        const leaseAgeMs = now() - processingStartedAt;
        if (leaseAgeMs < PROCESSING_LEASE_TIMEOUT_MS) {
          return {
            eventId,
            outcome: 'idempotent',
            reason: t('reasons.alreadyProcessing'),
          };
        }
        recordToClaim = recoverStaleProcessingRecord(parsedRecord);
      } else if (parsedRecord.status !== 'pending') {
        return {
          eventId,
          outcome: 'idempotent',
          reason: `${t('reasons.alreadyStatusPrefix')}${parsedRecord.status}`,
        };
      }

      if (!snapshot.etag) {
        break;
      }

      const claimed = await atomicStore.setIfMatch(
        queuePath,
        buildClaimedProcessingRecord(recordToClaim, now()),
        snapshot.etag,
      );
      if (claimed.applied) {
        record = recordToClaim;
        break;
      }
    }

    if (!record) {
      return {
        eventId,
        outcome: 'idempotent',
        reason: t('reasons.claimConflictRetryExhausted'),
      };
    }
  } else {
    rawRecord = await dependencies.queueStore.get(queuePath);
    if (!rawRecord) {
      return {
        eventId,
        outcome: 'missing',
        reason: t('reasons.queueRecordMissing'),
      };
    }
  }

  const parsedRecord = messagingQueueRecordSchema.safeParse(rawRecord);
  if (!parsedRecord.success) {
    await dependencies.queueStore.update(queuePath, {
      status: 'failed',
      retryCount: 1,
      lastError: t('errors.invalidQueueRecord'),
      processedAt: now(),
    });

    return {
      eventId,
      outcome: 'invalid',
      reason: t('reasons.invalidQueueRecord'),
    };
  }

  record = record ?? parsedRecord.data;
  if (record.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
    return {
      eventId,
      outcome: 'unsupported',
      reason: `${t('reasons.unsupportedEventTypePrefix')}${record.eventType}`,
    };
  }

  if (record.status === 'processing') {
    const processingStartedAt =
      typeof record.processedAt === 'number' ? record.processedAt : record.createdAt;
    const leaseAgeMs = now() - processingStartedAt;
    if (leaseAgeMs < PROCESSING_LEASE_TIMEOUT_MS) {
      return {
        eventId,
        outcome: 'idempotent',
        reason: t('reasons.alreadyProcessing'),
      };
    }

    const recoveredRecord = recoverStaleProcessingRecord(record);
    await dependencies.queueStore.update(queuePath, {
      status: recoveredRecord.status,
      lastError: recoveredRecord.lastError,
      processedAt: recoveredRecord.processedAt,
    });
    record = recoveredRecord;
  }

  if (record.status !== 'pending') {
    return {
      eventId,
      outcome: 'idempotent',
      reason: `${t('reasons.alreadyStatusPrefix')}${record.status}`,
    };
  }

  if (!atomicStore) {
    await dependencies.queueStore.update(queuePath, {
      status: 'processing',
      lastError: null,
      processedAt: now(),
    });
  }

  const processorResult = await processArrival48HoursQueueRecord(record, dependencies);

  if (processorResult.transition) {
    await dependencies.queueStore.update(queuePath, processorResult.transition);
  }

  return {
    eventId,
    outcome: processorResult.outcome,
    reason: processorResult.reason,
    transition: processorResult.transition ?? undefined,
  };
}

import {
  MessagingEventType,
  messagingQueueRecordSchema,
} from '../../src/lib/messaging/triggers';
import {
  processArrival48HoursQueueRecord,
  type QueueProcessorDependencies,
  type QueueProcessorTransition,
} from '../../src/lib/messaging/queue-processor';

export interface MessagingQueueStore {
  get<T = unknown>(path: string): Promise<T | null>;
  update<T = unknown>(path: string, data: Partial<T>): Promise<void>;
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

function buildQueuePath(eventId: string): string {
  return `messagingQueue/${eventId}`;
}

export async function dispatchQueuedArrival48HoursEvent(
  eventId: string,
  dependencies: MessagingDispatcherDependencies,
): Promise<MessagingDispatcherResult> {
  const now = dependencies.now ?? Date.now;
  const queuePath = buildQueuePath(eventId);
  const rawRecord = await dependencies.queueStore.get(queuePath);

  if (!rawRecord) {
    return {
      eventId,
      outcome: 'missing',
      reason: 'queue_record_missing',
    };
  }

  const parsedRecord = messagingQueueRecordSchema.safeParse(rawRecord);
  if (!parsedRecord.success) {
    await dependencies.queueStore.update(queuePath, {
      status: 'failed',
      retryCount: 1,
      lastError: 'Invalid messaging queue record',
      processedAt: now(),
    });

    return {
      eventId,
      outcome: 'invalid',
      reason: 'invalid_queue_record',
    };
  }

  let record = parsedRecord.data;
  if (record.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
    return {
      eventId,
      outcome: 'unsupported',
      reason: `unsupported_event_type:${record.eventType}`,
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
        reason: 'already_processing',
      };
    }

    await dependencies.queueStore.update(queuePath, {
      status: 'pending',
      lastError: 'Recovered stale processing lease',
      processedAt: null,
    });
    record = {
      ...record,
      status: 'pending',
      lastError: 'Recovered stale processing lease',
      processedAt: null,
    };
  }

  if (record.status !== 'pending') {
    return {
      eventId,
      outcome: 'idempotent',
      reason: `already_${record.status}`,
    };
  }

  await dependencies.queueStore.update(queuePath, {
    status: 'processing',
    lastError: null,
    processedAt: now(),
  });

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

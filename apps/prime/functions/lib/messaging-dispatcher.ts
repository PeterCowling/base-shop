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

function buildQueuePath(eventId: string): string {
  return `messagingQueue/${eventId}`;
}

export async function dispatchQueuedArrival48HoursEvent(
  eventId: string,
  dependencies: MessagingDispatcherDependencies,
): Promise<MessagingDispatcherResult> {
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
    const now = dependencies.now ?? Date.now;
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

  const record = parsedRecord.data;
  if (record.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
    return {
      eventId,
      outcome: 'unsupported',
      reason: `unsupported_event_type:${record.eventType}`,
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


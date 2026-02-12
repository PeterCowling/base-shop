import {
  type Arrival48HoursPayload,
  MessagingEventType,
  type MessagingQueueRecord,
} from './triggers';

export type ProviderFailureKind = 'transient' | 'permanent';

export interface QueueProcessorTransition {
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  lastError: string | null;
  processedAt: number | null;
}

export interface QueueProcessorResult {
  outcome: 'sent' | 'idempotent' | 'retry' | 'failed' | 'unsupported';
  transition: QueueProcessorTransition | null;
  reason?: string;
}

export interface QueueProcessorDependencies {
  dispatchArrival48Hours: (
    payload: Arrival48HoursPayload,
    record: MessagingQueueRecord,
  ) => Promise<void>;
  classifyProviderError?: (error: unknown) => ProviderFailureKind;
  now?: () => number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return 'Unknown provider error';
}

function defaultClassifyProviderError(error: unknown): ProviderFailureKind {
  if (!error || typeof error !== 'object') {
    return 'transient';
  }

  const maybeError = error as { permanent?: unknown; code?: unknown; status?: unknown };
  if (maybeError.permanent === true) {
    return 'permanent';
  }

  const rawCode = typeof maybeError.code === 'string'
    ? maybeError.code.toLowerCase()
    : '';
  if (
    rawCode === 'invalid_payload' ||
    rawCode === 'permission_denied' ||
    rawCode === 'unauthorized' ||
    rawCode === 'forbidden'
  ) {
    return 'permanent';
  }

  const status = typeof maybeError.status === 'number' ? maybeError.status : null;
  if (status !== null && status >= 400 && status < 500 && status !== 429) {
    return 'permanent';
  }

  return 'transient';
}

/**
 * Process one queue record for the `arrival.48hours` trigger with deterministic
 * idempotency + retry semantics.
 */
export async function processArrival48HoursQueueRecord(
  record: MessagingQueueRecord,
  dependencies: QueueProcessorDependencies,
): Promise<QueueProcessorResult> {
  if (record.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
    return {
      outcome: 'unsupported',
      transition: null,
      reason: `unsupported_event_type:${record.eventType}`,
    };
  }

  if (record.status !== 'pending') {
    return {
      outcome: 'idempotent',
      transition: null,
      reason: `already_${record.status}`,
    };
  }

  const now = dependencies.now ?? Date.now;
  const classifyProviderError = dependencies.classifyProviderError ?? defaultClassifyProviderError;

  try {
    await dependencies.dispatchArrival48Hours(
      record.payload as Arrival48HoursPayload,
      record,
    );

    return {
      outcome: 'sent',
      transition: {
        status: 'sent',
        retryCount: record.retryCount ?? 0,
        lastError: null,
        processedAt: now(),
      },
    };
  } catch (error) {
    const nextRetryCount = (record.retryCount ?? 0) + 1;
    const lastError = getErrorMessage(error);
    const failureKind = classifyProviderError(error);

    if (failureKind === 'permanent') {
      return {
        outcome: 'failed',
        transition: {
          status: 'failed',
          retryCount: nextRetryCount,
          lastError,
          processedAt: now(),
        },
      };
    }

    return {
      outcome: 'retry',
      transition: {
        status: 'pending',
        retryCount: nextRetryCount,
        lastError,
        processedAt: null,
      },
    };
  }
}

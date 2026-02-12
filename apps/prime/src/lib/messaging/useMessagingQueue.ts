/**
 * useMessagingQueue
 *
 * Hook for writing messaging events to Firebase queue.
 * Events are processed by Cloud Functions.
 */

import { useCallback, useState } from 'react';

import { get, ref, set } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';

import {
  createQueueRecord,
  MessagingEventType,
  type MessagingEventType as MessagingEventTypeValue,
  type MessagingPayload,
} from './triggers';

interface UseMessagingQueueReturn {
  /** Queue a messaging event */
  queueEvent: (
    eventType: MessagingEventTypeValue,
    payload: MessagingPayload,
  ) => Promise<string | null>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Hook for queueing messaging events to Firebase.
 */
export function useMessagingQueue(): UseMessagingQueueReturn {
  const database = useFirebaseDatabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queueEvent = useCallback(
    async (
      eventType: MessagingEventTypeValue,
      payload: MessagingPayload,
    ): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const record = createQueueRecord(eventType, payload);
        const queueRef = ref(database, `messagingQueue/${record.eventId}`);

        if (eventType === MessagingEventType.BOOKING_CONFIRMED) {
          const existing = await get(queueRef);
          if (existing.exists()) {
            return record.eventId;
          }
        }

        await set(queueRef, record);

        logger.info(
          `[useMessagingQueue] Queued event: ${eventType} (${record.eventId})`,
        );

        return record.eventId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('[useMessagingQueue] Failed to queue event:', err);
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [database],
  );

  return {
    queueEvent,
    isLoading,
    error,
  };
}

import { ref, set, update } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { QuestProgress } from '../../types/questProgress';
import useUuid from '../useUuid';

/**
 * Partial representation of quest progress for incremental updates.
 */
export type QuestProgressPayload = Partial<QuestProgress>;

export interface UseQuestProgressMutatorReturn {
  /** Update specific fields on quest progress (merge) */
  updateProgress: (payload: QuestProgressPayload) => Promise<void>;
  /** Replace the entire quest progress (used for initialization/reset) */
  setProgress: (progress: QuestProgress) => Promise<void>;
  /** Mark a tier as completed */
  completeTier: (tierId: string) => Promise<void>;
  /** Initialize quest progress for a new booking */
  initializeProgress: (bookingId: string, checkInDate: string) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * useQuestProgressMutator
 * A mutator hook for writing quest progress data to Firebase.
 *
 * Provides methods for:
 * - updateProgress: Merges partial updates into existing progress
 * - setProgress: Replaces the entire progress (used for reset)
 * - completeTier: Marks a specific tier as completed
 * - initializeProgress: Sets up fresh progress for a new booking
 */
export function useQuestProgressMutator(): UseQuestProgressMutatorReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const updateProgress = useCallback(
    async (payload: QuestProgressPayload) => {
      if (!uuid) {
        logger.warn('[useQuestProgressMutator] Missing uuid');
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      try {
        const progressRef = ref(database, `questProgress/${uuid}`);
        await update(progressRef, payload);

        setIsSuccess(true);
      } catch (error) {
        logger.error(
          '[useQuestProgressMutator] Error in updateProgress:',
          error,
        );
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database],
  );

  const setProgress = useCallback(
    async (progress: QuestProgress) => {
      if (!uuid) {
        logger.warn('[useQuestProgressMutator] Missing uuid');
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      try {
        const progressRef = ref(database, `questProgress/${uuid}`);
        await set(progressRef, progress);

        setIsSuccess(true);
      } catch (error) {
        logger.error('[useQuestProgressMutator] Error in setProgress:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database],
  );

  const completeTier = useCallback(
    async (tierId: string) => {
      if (!uuid || !tierId) {
        logger.warn('[useQuestProgressMutator] Missing uuid or tierId:', {
          uuid,
          tierId,
        });
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      try {
        const progressRef = ref(database, `questProgress/${uuid}`);
        const now = Date.now();

        // We need to read-then-write to append to completedTiers array
        // This could be optimized with Firebase transactions if needed
        const { get } = await import('@/services/firebase');
        const snapshot = await get(progressRef);
        const currentProgress = snapshot.val() as QuestProgress | null;

        const completedTiers = currentProgress?.completedTiers || [];
        if (!completedTiers.includes(tierId)) {
          completedTiers.push(tierId);
        }

        const tierCompletedAt = currentProgress?.tierCompletedAt || {};
        tierCompletedAt[tierId] = now;

        await update(progressRef, {
          completedTiers,
          tierCompletedAt,
        });

        setIsSuccess(true);
      } catch (error) {
        logger.error('[useQuestProgressMutator] Error in completeTier:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database],
  );

  const initializeProgress = useCallback(
    async (bookingId: string, checkInDate: string) => {
      if (!uuid) {
        logger.warn('[useQuestProgressMutator] Missing uuid');
        return;
      }

      const freshProgress: QuestProgress = {
        bookingId,
        checkInDate,
        currentTier: 'settle-in',
        completedTiers: [],
        tierCompletedAt: {},
      };

      await setProgress(freshProgress);
    },
    [uuid, setProgress],
  );

  return {
    updateProgress,
    setProgress,
    completeTier,
    initializeProgress,
    isLoading,
    isError,
    isSuccess,
  };
}

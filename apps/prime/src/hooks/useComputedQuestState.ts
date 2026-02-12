/**
 * useComputedQuestState
 *
 * Hook that fetches all required data and computes the current quest state.
 * This is the main interface for components to access quest information.
 *
 * The hook:
 * 1. Fetches completed tasks, guest profile, and quest progress
 * 2. Computes the quest state using the pure computeQuestState function
 * 3. Provides methods for completing tiers when all tasks are done
 */

import { useCallback, useMemo } from 'react';

import {
  computeQuestState,
  getTiersReadyForCompletion,
  type QuestState,
} from '../lib/quests/computeQuestState';
import type { OccupantCompletedTasks } from '../types/completedTasks';

// Internal hook to access occupantData from useUnifiedBookingData
// This is needed because useGuestProgressData doesn't expose completedTasks
import { useGuestProgressData } from './dataOrchestrator/useGuestProgressData';
import { useUnifiedBookingData } from './dataOrchestrator/useUnifiedBookingData';
import { useQuestProgressMutator } from './mutator/useQuestProgressMutator';

/**
 * Extended quest state with loading/error states and actions.
 */
export interface ComputedQuestStateResult {
  /** Computed quest state (or null while loading) */
  questState: QuestState | null;
  /** Loading state */
  isLoading: boolean;
  /** Error from data fetching */
  error: Error | null;
  /** Complete a tier (called when all tasks for a tier are done) */
  completeTier: (tierId: string) => Promise<void>;
  /** Tiers that have all tasks complete but aren't recorded yet */
  pendingCompletions: string[];
  /** Auto-complete any pending tier completions */
  processPendingCompletions: () => Promise<void>;
}

/**
 * Hook to get computed quest state with all required data.
 */
export function useComputedQuestState(): ComputedQuestStateResult {
  // Get all data from the orchestrator hook
  const {
    guestProfile,
    effectiveQuestProgress,
    isLoading,
    error,
  } = useGuestProgressData();

  // Get completed tasks directly from unified booking data
  // This is needed because useGuestProgressData doesn't expose completedTasks directly
  const { occupantData } = useGuestProgressDataInternal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const completedTasks: OccupantCompletedTasks = occupantData?.completedTasks ?? {};

  // Get quest progress mutator
  const { completeTier: completeTierMutator } = useQuestProgressMutator();

  // Compute quest state
  const questState = useMemo((): QuestState | null => {
    if (isLoading) return null;

    return computeQuestState({
      completedTasks,
      guestProfile,
      questProgress: effectiveQuestProgress,
      currentTime: Date.now(),
    });
  }, [completedTasks, guestProfile, effectiveQuestProgress, isLoading]);

  // Find tiers that are ready for completion but not recorded
  const pendingCompletions = useMemo((): string[] => {
    if (!questState) return [];

    return getTiersReadyForCompletion(
      completedTasks,
      questState.completedTiers,
      questState.hoursElapsed,
    );
  }, [completedTasks, questState]);

  // Complete a specific tier
  const completeTier = useCallback(
    async (tierId: string) => {
      await completeTierMutator(tierId);
    },
    [completeTierMutator],
  );

  // Process all pending tier completions
  const processPendingCompletions = useCallback(async () => {
    for (const tierId of pendingCompletions) {
      await completeTier(tierId);
    }
  }, [pendingCompletions, completeTier]);

  return {
    questState,
    isLoading,
    error: error as Error | null,
    completeTier,
    pendingCompletions,
    processPendingCompletions,
  };
}

function useGuestProgressDataInternal() {
  const { occupantData } = useUnifiedBookingData();
  return { occupantData };
}

/**
 * Lightweight hook for components that only need basic quest info.
 * Returns a subset of the full quest state.
 */
export interface BasicQuestInfo {
  /** Current active tier ID */
  activeTier: string | null;
  /** Progress percentage of current tier */
  currentProgress: number;
  /** Total XP earned */
  totalXp: number;
  /** Number of badges earned */
  badgeCount: number;
  /** Whether all quests are complete */
  allComplete: boolean;
  /** Loading state */
  isLoading: boolean;
}

export function useBasicQuestInfo(): BasicQuestInfo {
  const { questState, isLoading } = useComputedQuestState();

  return useMemo(
    (): BasicQuestInfo => ({
      activeTier: questState?.activeTier ?? null,
      currentProgress:
        questState?.activeTier && questState.tierProgress[questState.activeTier]
          ? questState.tierProgress[questState.activeTier].percentage
          : 0,
      totalXp: questState?.totalXp ?? 0,
      badgeCount: questState?.badges.length ?? 0,
      allComplete: questState?.allComplete ?? false,
      isLoading,
    }),
    [questState, isLoading],
  );
}

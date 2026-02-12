/**
 * useGuestProgressData
 *
 * Data orchestrator hook that combines guest profile and quest progress data
 * with staleness detection against the current booking.
 *
 * This hook:
 * 1. Fetches the current booking's reservationCode (bookingId) and checkInDate
 * 2. Fetches guest profile with staleness check
 * 3. Fetches quest progress with staleness check
 * 4. Provides initialization function for new/stale progress
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  initializeQuestProgressFromCompletedTasks,
  isQuestProgressStale,
} from '../../lib/quests/initializeQuestProgress';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import type { GuestProfile, ProfileStatus } from '../../types/guestProfile';
import type { QuestProgress } from '../../types/questProgress';
import { useQuestProgressMutator } from '../mutator/useQuestProgressMutator';
import { useFetchGuestProfile } from '../pureData/useFetchGuestProfile';
import { useFetchQuestProgress } from '../pureData/useFetchQuestProgress';

import { useUnifiedBookingData } from './useUnifiedBookingData';

export interface GuestProgressData {
  /** Current booking ID from occupant data */
  currentBookingId: string | null;
  /** Current check-in date from occupant data */
  currentCheckInDate: string | null;

  /** Raw guest profile data (may be stale) */
  guestProfile: GuestProfile | null;
  /** Whether the profile is from a previous booking */
  isProfileStale: boolean;
  /** Effective profile status for UI decisions */
  effectiveProfileStatus: ProfileStatus;
  /** Whether to show the profile completion banner */
  showProfileBanner: boolean;

  /** Raw quest progress data (may be stale) */
  questProgress: QuestProgress | null;
  /** Whether the quest progress is from a previous booking */
  isQuestStale: boolean;
  /** Effective quest progress for UI (defaults applied if stale/missing) */
  effectiveQuestProgress: QuestProgress;

  /** Loading state for all data */
  isLoading: boolean;
  /** Error from any data source */
  error: Error | null;

  /** Initialize quest progress for current booking */
  initializeQuest: () => Promise<void>;
  /** Whether quest has been initialized for current booking */
  isQuestInitialized: boolean;
}

/**
 * Hook to get guest profile and quest progress with staleness detection.
 */
export function useGuestProgressData(): GuestProgressData {
  const [isQuestInitialized, setIsQuestInitialized] = useState(false);

  // Get current booking info
  const {
    occupantData,
    isLoading: bookingLoading,
    error: bookingError,
  } = useUnifiedBookingData();

  const currentBookingId = occupantData?.reservationCode ?? null;
  const currentCheckInDate = occupantData?.checkInDate ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const completedTasks: OccupantCompletedTasks =
    occupantData?.completedTasks ?? {};

  // Fetch guest profile with staleness check
  const {
    data: guestProfile,
    isLoading: profileLoading,
    error: profileError,
    isStale: isProfileStale,
    effectiveProfile: _effectiveProfile,
  } = useFetchGuestProfile({
    enabled: !!currentBookingId,
    currentBookingId: currentBookingId ?? undefined,
  });

  // Fetch quest progress with staleness check
  const {
    data: questProgress,
    isLoading: questLoading,
    error: questError,
    isStale: isQuestStale,
    effectiveProgress: effectiveQuestProgress,
  } = useFetchQuestProgress({
    enabled: !!currentBookingId,
    currentBookingId: currentBookingId ?? undefined,
  });

  // Mutators
  const { setProgress } = useQuestProgressMutator();

  // Determine effective profile status
  const effectiveProfileStatus: ProfileStatus = useMemo(() => {
    if (isProfileStale || !guestProfile) {
      return 'partial';
    }
    return guestProfile.profileStatus;
  }, [guestProfile, isProfileStale]);

  // Determine whether to show profile banner
  const showProfileBanner = useMemo(() => {
    // Show if profile is stale (returning guest with new booking)
    if (isProfileStale) return true;
    // Show if profile doesn't exist
    if (!guestProfile) return true;
    // Show if profile is not complete
    if (guestProfile.profileStatus !== 'complete') return true;
    return false;
  }, [guestProfile, isProfileStale]);

  // Initialize quest progress for current booking
  const initializeQuest = useCallback(async () => {
    if (!currentBookingId || !currentCheckInDate) {
      return;
    }

    const freshProgress = initializeQuestProgressFromCompletedTasks(
      currentBookingId,
      currentCheckInDate,
      completedTasks,
    );

    await setProgress(freshProgress);
    setIsQuestInitialized(true);
  }, [currentBookingId, currentCheckInDate, completedTasks, setProgress]);

  // Auto-initialize quest if stale or missing
  useEffect(() => {
    if (bookingLoading || questLoading) return;
    if (!currentBookingId || !currentCheckInDate) return;
    if (isQuestInitialized) return;

    const needsInit = isQuestProgressStale(questProgress, currentBookingId);
    if (needsInit) {
      void initializeQuest();
    } else {
      // Quest exists and is valid for current booking
      setIsQuestInitialized(true);
    }
  }, [
    bookingLoading,
    questLoading,
    currentBookingId,
    currentCheckInDate,
    questProgress,
    isQuestInitialized,
    initializeQuest,
  ]);

  // Combine loading states
  const isLoading = bookingLoading || profileLoading || questLoading;

  // Combine errors (first error wins)
  const error = bookingError || profileError || questError || null;

  return {
    currentBookingId,
    currentCheckInDate,
    guestProfile,
    isProfileStale,
    effectiveProfileStatus,
    showProfileBanner,
    questProgress,
    isQuestStale,
    effectiveQuestProgress,
    isLoading,
    error: error as Error | null,
    initializeQuest,
    isQuestInitialized,
  };
}

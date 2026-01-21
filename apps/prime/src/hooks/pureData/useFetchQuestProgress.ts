/* File: /src/hooks/pureData/useFetchQuestProgress.ts
   Explanation:
   - Uses React Query for caching quest progress data
   - Cache key: ['questProgress', uuid]
   - Includes staleness check against current bookingId
   - Stale time: 5 minutes (progress updates during quests)
   - Cache time: 30 minutes
*/

import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { QuestProgress } from '../../types/questProgress';
import { DEFAULT_QUEST_PROGRESS } from '../../types/questProgress';
import useUuid from '../useUuid';

/**
 * Helper function to fetch quest progress from "questProgress/{uuid}".
 * Returns the progress or null if not found.
 */
async function fetchQuestProgress(
  uuid: string,
  database: Database,
): Promise<QuestProgress | null> {
  if (!uuid) {
    return null;
  }
  try {
    const snapshot = await get(ref(database, `questProgress/${uuid}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as QuestProgress;
  } catch (error) {
    logger.error('Error fetching quest progress:', error);
    throw error;
  }
}

/**
 * Options for useFetchQuestProgress hook.
 */
export interface UseFetchQuestProgressOptions {
  /** Whether to enable the query (default: true). Useful for lazy loading. */
  enabled?: boolean;
  /** Current booking ID for staleness check. If provided and doesn't match progress's bookingId, returns stale data. */
  currentBookingId?: string;
}

/**
 * Result from useFetchQuestProgress including staleness detection.
 */
export interface UseFetchQuestProgressResult {
  data: QuestProgress | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  /** True if the progress exists but belongs to a different booking */
  isStale: boolean;
  /** Returns default progress values when data is null or stale */
  effectiveProgress: QuestProgress;
  refetch: () => Promise<void>;
}

/**
 * useFetchQuestProgress
 * A "Pure Data" hook to retrieve quest progress from Firebase with caching and staleness detection.
 *
 * @param options - Optional configuration including enabled flag and currentBookingId for staleness check
 * @returns { data, error, isLoading, isError, isStale, effectiveProgress, refetch }
 */
export function useFetchQuestProgress(
  options: UseFetchQuestProgressOptions = {},
): UseFetchQuestProgressResult {
  const { enabled: externalEnabled = true, currentBookingId } = options;
  const uuid: string = useUuid();
  const database: Database = useFirebaseDatabase();

  const {
    data,
    error,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['questProgress', uuid],
    queryFn: () => fetchQuestProgress(uuid, database),
    enabled: !!uuid && externalEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const refetch = async (): Promise<void> => {
    await refetchQuery();
  };

  // Staleness check: progress belongs to a different booking
  const isStale =
    !!data && !!currentBookingId && data.bookingId !== currentBookingId;

  // Return default values when no data or stale
  const effectiveProgress =
    data && !isStale
      ? data
      : {
          ...DEFAULT_QUEST_PROGRESS,
          bookingId: currentBookingId || '',
        };

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    isStale,
    effectiveProgress,
    refetch,
  };
}

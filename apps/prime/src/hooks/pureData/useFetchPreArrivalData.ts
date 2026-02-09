/**
 * useFetchPreArrivalData
 *
 * Pure Data hook to retrieve pre-arrival data from Firebase.
 * Path: preArrival/{uuid}
 *
 * Uses React Query for caching with:
 * - Stale time: 2 minutes (pre-arrival data may change frequently)
 * - Cache time: 10 minutes
 */

import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { PreArrivalData } from '../../types/preArrival';
import { DEFAULT_PRE_ARRIVAL } from '../../types/preArrival';
import useUuid from '../useUuid';

/**
 * Fetch pre-arrival data from Firebase.
 * Returns null if the record doesn't exist.
 */
async function fetchPreArrivalData(
  uuid: string,
  database: Database,
): Promise<PreArrivalData | null> {
  if (!uuid) {
    return null;
  }

  try {
    const snapshot = await get(ref(database, `preArrival/${uuid}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as PreArrivalData;
  } catch (error) {
    logger.error('[useFetchPreArrivalData] Error fetching pre-arrival data:', error);
    throw error;
  }
}

/**
 * Options for useFetchPreArrivalData hook.
 */
export interface UseFetchPreArrivalDataOptions {
  /** Whether to enable the query (default: true). */
  enabled?: boolean;
}

/**
 * Result from useFetchPreArrivalData.
 */
export interface UseFetchPreArrivalDataResult {
  /** Raw data from Firebase (null if not found) */
  data: PreArrivalData | null;
  /** Error if fetch failed */
  error: Error | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Effective data with defaults applied (never null) */
  effectiveData: PreArrivalData;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * useFetchPreArrivalData
 *
 * Fetches pre-arrival data for the current guest from Firebase.
 * Returns effectiveData with defaults applied when no data exists.
 */
export function useFetchPreArrivalData(
  options: UseFetchPreArrivalDataOptions = {},
): UseFetchPreArrivalDataResult {
  const { enabled = true } = options;
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const {
    data,
    error,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['preArrivalData', uuid],
    queryFn: () => fetchPreArrivalData(uuid, database),
    enabled: !!uuid && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = async (): Promise<void> => {
    await refetchQuery();
  };

  // Apply defaults when no data exists
  const effectiveData: PreArrivalData = data ?? DEFAULT_PRE_ARRIVAL;

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    effectiveData,
    refetch,
  };
}

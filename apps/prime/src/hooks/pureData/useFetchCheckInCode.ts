/**
 * useFetchCheckInCode
 *
 * Pure Data hook to retrieve check-in code from Firebase.
 * Path: checkInCodes/byUuid/{uuid}
 *
 * Uses React Query for caching with:
 * - Stale time: 5 minutes (codes don't change once generated)
 * - Cache time: 30 minutes
 */

import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { CheckInCodeRecord } from '../../types/checkInCode';
import { CHECK_IN_CODE_PATHS } from '../../types/checkInCode';
import useUuid from '../useUuid';

/**
 * Fetch check-in code from Firebase.
 * Returns null if the record doesn't exist or is expired.
 */
async function fetchCheckInCode(
  uuid: string,
  database: Database,
): Promise<CheckInCodeRecord | null> {
  if (!uuid) {
    return null;
  }

  try {
    const codePath = CHECK_IN_CODE_PATHS.byUuid(uuid);
    const snapshot = await get(ref(database, codePath));

    if (!snapshot.exists()) {
      return null;
    }

    const record = snapshot.val() as CheckInCodeRecord;

    // Check if code is expired
    if (record.expiresAt && record.expiresAt < Date.now()) {
      logger.debug('[useFetchCheckInCode] Code expired');
      return null;
    }

    return record;
  } catch (error) {
    logger.error('[useFetchCheckInCode] Error fetching check-in code:', error);
    throw error;
  }
}

/**
 * Options for useFetchCheckInCode hook.
 */
export interface UseFetchCheckInCodeOptions {
  /** Whether to enable the query (default: true). */
  enabled?: boolean;
}

/**
 * Result from useFetchCheckInCode.
 */
export interface UseFetchCheckInCodeResult {
  /** Check-in code record (null if not found or expired) */
  data: CheckInCodeRecord | null;
  /** Error if fetch failed */
  error: Error | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** The code string itself (convenience accessor) */
  code: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * useFetchCheckInCode
 *
 * Fetches check-in code for the current guest from Firebase.
 */
export function useFetchCheckInCode(
  options: UseFetchCheckInCodeOptions = {},
): UseFetchCheckInCodeResult {
  const { enabled = true } = options;
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const {
    data,
    error,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['checkInCode', uuid],
    queryFn: () => fetchCheckInCode(uuid, database),
    enabled: !!uuid && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const refetch = async (): Promise<void> => {
    await refetchQuery();
  };

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    code: data?.code ?? null,
    refetch,
  };
}

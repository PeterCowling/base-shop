'use client';

// File: /src/hooks/pureData/useFetchFinancialsRoom.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';
import { get, ref, type Database } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { FinancialsRoomRecord } from '../../types/financialsRoom';

/**
 * Fetch booking financial info from "financialsRoom/{bookingRef}".
 */
async function fetchFinancialsRoomForBooking(
  bookingRef: string,
  database: Database,
): Promise<FinancialsRoomRecord | null> {
  try {
    const snapshot = await get(ref(database, `financialsRoom/${bookingRef}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as FinancialsRoomRecord;
  } catch (error) {
    logger.error('Error fetching financialsRoom data:', error);
    throw error;
  }
}

interface UseFetchFinancialsRoomOptions {
  enabled?: boolean;
}

export function useFetchFinancialsRoom(
  bookingRef: string,
  options: UseFetchFinancialsRoomOptions = {},
) {
  const { enabled = true } = options;
  const database = useFirebaseDatabase();

  const { data, error, isLoading, refetch: rqRefetch } = useQuery({
    queryKey: ['financialsRoom', bookingRef],
    queryFn: () => fetchFinancialsRoomForBooking(bookingRef, database),
    enabled: enabled && !!bookingRef,
  });

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    refetch: async () => { await rqRefetch(); },
  };
}

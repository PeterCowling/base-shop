'use client';

// File: /src/hooks/pureData/useFetchGuestDetails.ts
// OPT-02: Uses React Query for caching and automatic refetch.

import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestDetailsRecord } from '../../types/guestsDetails';
import useUuid from '../useUuid';

/**
 * Fetch occupant details from "guestsDetails/{bookingRef}/{occupantId}".
 */
async function fetchGuestDetails(
  bookingRef: string,
  occupantId: string,
  database: Database,
): Promise<GuestDetailsRecord | null> {
  try {
    const snapshot = await get(
      ref(database, `guestsDetails/${bookingRef}/${occupantId}`),
    );
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as GuestDetailsRecord;
  } catch (error) {
    logger.error('Error fetching guestsDetails occupant data:', error);
    throw error;
  }
}

export function useFetchGuestDetails(bookingRef: string) {
  const occupantId = useUuid();
  const database = useFirebaseDatabase();

  const { data, error, isLoading, refetch: rqRefetch } = useQuery({
    queryKey: ['guestDetails', bookingRef, occupantId],
    queryFn: () => fetchGuestDetails(bookingRef, occupantId!, database),
    enabled: !!occupantId && !!bookingRef,
  });

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    refetch: async () => { await rqRefetch(); },
  };
}

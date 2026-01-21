'use client';

/* File: /src/hooks/data/pure/useFetchFinancialsRoom.ts
   Explanation:
   - The hook wraps its fetching logic in `loadData` and exposes a `refetch` function.
   - Consuming components can now manually reload financials data.
*/

import { get, ref, type Database } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { FinancialsRoomRecord } from '../../types/financialsRoom';

/**
 * Helper to fetch booking financial info from "financialsRoom/{bookingRef}"
 */
async function fetchFinancialsRoomForBooking(
  bookingRef: string,
  database: Database,
): Promise<FinancialsRoomRecord | null> {
  if (!bookingRef) {
    return null;
  }
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

export function useFetchFinancialsRoom(bookingRef: string) {
  const database: Database = useFirebaseDatabase();
  const [data, setData] = useState<FinancialsRoomRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async (): Promise<void> => {
    if (!bookingRef) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchFinancialsRoomForBooking(bookingRef, database);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [bookingRef, database]);

  useEffect(() => {
    loadData().catch(() => {
      /* Error is handled in loadData */
    });
  }, [loadData]);

  const refetch = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch,
  };
}

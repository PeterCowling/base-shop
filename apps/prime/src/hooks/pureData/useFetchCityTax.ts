'use client';

/* File: /src/hooks/pureData/useFetchCityTax.ts
   Explanation:
   - The fetching logic is encapsulated in the `loadData` callback.
   - The hook calls `loadData` on mount (via useEffect) and exposes a `refetch` function.
   - This ensures that the hook returns { data, error, isLoading, isError, refetch } with strong typing.
*/

import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { CityTaxBookingRecord } from '../../types/cityTax';

/**
 * Helper function to fetch booking city tax data from "cityTax/{bookingRef}"
 */
async function fetchCityTaxForBooking(
  bookingRef: string,
  database: ReturnType<typeof useFirebaseDatabase>,
): Promise<CityTaxBookingRecord | null> {
  if (!bookingRef) {
    return null;
  }
  try {
    const snapshot = await get(ref(database, `cityTax/${bookingRef}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as CityTaxBookingRecord;
  } catch (error) {
    logger.error('Error fetching city tax data:', error);
    throw error;
  }
}

export function useFetchCityTax(bookingRef: string) {
  const database = useFirebaseDatabase();
  const [data, setData] = useState<CityTaxBookingRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Centralized data fetching function
  const loadData = useCallback(async (): Promise<void> => {
    if (!bookingRef) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchCityTaxForBooking(bookingRef, database);
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

  // Expose refetch to allow manual data refresh
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

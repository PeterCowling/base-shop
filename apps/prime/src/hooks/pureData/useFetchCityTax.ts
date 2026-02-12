'use client';

// File: /src/hooks/pureData/useFetchCityTax.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';

import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { CityTaxBookingRecord } from '../../types/cityTax';

/**
 * Fetch booking city tax data from "cityTax/{bookingRef}".
 */
async function fetchCityTaxForBooking(
  bookingRef: string,
  database: ReturnType<typeof useFirebaseDatabase>,
): Promise<CityTaxBookingRecord | null> {
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

interface UseFetchCityTaxOptions {
  enabled?: boolean;
}

export function useFetchCityTax(
  bookingRef: string,
  options: UseFetchCityTaxOptions = {},
) {
  const { enabled = true } = options;
  const database = useFirebaseDatabase();

  const { data, error, isLoading, refetch: rqRefetch } = useQuery({
    queryKey: ['cityTax', bookingRef],
    queryFn: () => fetchCityTaxForBooking(bookingRef, database),
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

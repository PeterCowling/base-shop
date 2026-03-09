'use client';

// File: /src/hooks/pureData/useFetchCityTax.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';

import logger from '@acme/lib/logger/client';

import { get, ref } from '@/services/firebase';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { CityTaxBookingRecord } from '../../types/cityTax';

import type { PureDataRefetch } from './types';

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
    logger.error('Error fetching city tax data:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
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
    refetch: rqRefetch as unknown as PureDataRefetch,
  };
}

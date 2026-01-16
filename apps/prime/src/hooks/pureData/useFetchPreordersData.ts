'use client';

/* File: /src/hooks/pureData/useFetchPreordersData.ts
   Explanation:
   - The fetching logic is wrapped in a `loadData` callback that is invoked on mount and via the `refetch` function.
   - The hook now returns a strongly typed `refetch` method.
*/

import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { PreorderNightData } from '../../types/preorder';
import useUuid from '../useUuid';

/**
 * Pure Data Hook to fetch occupant preorders from Firebase:
 *   occupant_id => night_key => PreorderNightData
 *
 * If no data is found, returns an empty array.
 *
 * @returns { preordersData, isLoading, error, refetch }
 */
export function useFetchPreordersData() {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const [preordersData, setPreordersData] = useState<
    Array<Omit<PreorderNightData, 'id'> & { id: string }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Centralized function to load preorders data
  const loadData = useCallback(async (): Promise<void> => {
    if (!uuid) {
      setPreordersData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const preordersRef = ref(database, `preorder/${uuid}`);
      const snapshot = await get(preordersRef);
      if (!snapshot.exists()) {
        setPreordersData([]);
      } else {
        const data = snapshot.val() as Record<string, PreorderNightData>;
        const arrayData = Object.entries(data).map(
          ([nightKey, orderDetails]) => ({
            night: orderDetails.night,
            breakfast: orderDetails.breakfast,
            drink1: orderDetails.drink1,
            drink2: orderDetails.drink2,
            id: nightKey,
          }),
        );
        setPreordersData(arrayData);
      }
      setError(null);
    } catch (err: unknown) {
      logger.error('Error fetching preordersData:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [uuid, database]);

  useEffect(() => {
    loadData().catch(() => {
      // Error handling is managed within loadData
    });
  }, [loadData]);

  // Refetch function to manually reload preorders data
  const refetch = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  return { preordersData, isLoading, error, refetch };
}

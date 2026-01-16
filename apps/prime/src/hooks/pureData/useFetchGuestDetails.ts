'use client';

/* File: /src/hooks/pureData/useFetchGuestDetails.ts
   Explanation:
   - The fetching logic is moved into `loadData` so that it can be called on mount and on manual refresh.
   - A `refetch` function is exposed along with the other state properties.
*/

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestDetailsRecord } from '../../types/guestsDetails';
import useUuid from '../useUuid';

/**
 * Helper function to fetch occupant details from "guestsDetails/{bookingRef}/{occupantId}".
 */
async function fetchGuestDetails(
  bookingRef: string,
  occupantId: string,
  database: Database,
): Promise<GuestDetailsRecord | null> {
  if (!bookingRef || !occupantId) {
    return null;
  }
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
  const [data, setData] = useState<GuestDetailsRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(
    async (cancelled?: { current: boolean }): Promise<void> => {
      if (!occupantId || !bookingRef) {
        if (!cancelled?.current) {
          setData(null);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled?.current) setIsLoading(true);

      try {
        const result = await fetchGuestDetails(
          bookingRef,
          occupantId,
          database,
        );
        if (!cancelled?.current) {
          setData(result);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled?.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled?.current) setIsLoading(false);
      }
    },
    [bookingRef, occupantId, database],
  );

  useEffect(() => {
    const state = { current: false };
    loadData(state).catch(() => {
      /* Error is handled in loadData */
    });
    return () => {
      state.current = true;
    };
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

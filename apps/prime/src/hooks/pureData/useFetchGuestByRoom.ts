'use client';

/* File: /src/hooks/data/pure/useFetchGuestByRoom.ts
   Explanation:
   - The data fetching logic is centralized into the `loadData` callback.
   - A `refetch` function is added to support manual data reloading.
*/

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestByRoom } from '../../types/guestByRoom';
import useUuid from '../useUuid';

/**
 * Helper function to fetch occupant data from "guestByRoom/{occupantId}".
 * Returns an object in the shape: { [occupantId]: occupantRecord }.
 */
async function fetchGuestByRoom(
  occupantId: string,
  database: Database,
): Promise<GuestByRoom> {
  if (!occupantId) {
    return {};
  }
  try {
    const snapshot = await get(ref(database, `guestByRoom/${occupantId}`));
    if (!snapshot.exists()) {
      return {};
    }
    const occupantData = snapshot.val();
    return { [occupantId]: occupantData };
  } catch (err) {
    logger.error('Error fetching guestByRoom occupant data:', err);
    throw err;
  }
}

export function useFetchGuestByRoom() {
  const occupantId = useUuid();
  const database = useFirebaseDatabase();
  const [data, setData] = useState<GuestByRoom>({});
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(
    async (cancelled?: { current: boolean }): Promise<void> => {
      if (!occupantId) {
        if (!cancelled?.current) {
          setData({});
          setError(null);
          setIsLoading(false);
        }
        return;
      }
      if (!cancelled?.current) setIsLoading(true);
      try {
        const result = await fetchGuestByRoom(occupantId, database);
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
    [occupantId, database],
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

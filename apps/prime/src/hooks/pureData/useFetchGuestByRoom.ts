'use client';

// File: /src/hooks/pureData/useFetchGuestByRoom.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestByRoom } from '../../types/guestByRoom';
import useUuid from '../useUuid';

/**
 * Fetch occupant data from "guestByRoom/{occupantId}".
 * Returns { [occupantId]: occupantRecord }.
 */
async function fetchGuestByRoom(
  occupantId: string,
  database: Database,
): Promise<GuestByRoom> {
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

interface UseFetchGuestByRoomOptions {
  enabled?: boolean;
}

export function useFetchGuestByRoom(options: UseFetchGuestByRoomOptions = {}) {
  const { enabled = true } = options;
  const occupantId = useUuid();
  const database = useFirebaseDatabase();

  const { data, error, isLoading, refetch: rqRefetch } = useQuery({
    queryKey: ['guestByRoom', occupantId],
    queryFn: () => fetchGuestByRoom(occupantId!, database),
    enabled: enabled && !!occupantId,
  });

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    refetch: async () => { await rqRefetch(); },
  };
}

'use client';

// File: /src/hooks/pureData/useFetchGuestByRoom.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';

import logger from '@acme/lib/logger/client';

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestByRoom } from '../../types/guestByRoom';
import useUuid from '../useUuid';

import type { PureDataRefetch } from './types';

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
    logger.error('Error fetching guestByRoom occupant data:', err); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
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
    refetch: rqRefetch as unknown as PureDataRefetch,
  };
}

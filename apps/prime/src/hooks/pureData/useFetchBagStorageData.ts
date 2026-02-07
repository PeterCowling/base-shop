'use client';

// File: /src/hooks/pureData/useFetchBagStorageData.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { BagStorageRecord } from '../../types/bagStorage';
import useUuid from '../useUuid';

/**
 * Fetch bag storage info from "bagStorage/{uuid}".
 */
async function fetchBagStorage(
  uuid: string,
  database: ReturnType<typeof import('firebase/database').getDatabase>,
): Promise<BagStorageRecord | null> {
  try {
    const snapshot = await get(ref(database, `bagStorage/${uuid}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as BagStorageRecord;
  } catch (err) {
    logger.error('Error fetching bagStorageData:', err);
    throw err;
  }
}

interface UseFetchBagStorageDataOptions {
  enabled?: boolean;
}

export function useFetchBagStorageData(options: UseFetchBagStorageDataOptions = {}) {
  const { enabled = true } = options;
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ['bagStorage', uuid],
    queryFn: () => fetchBagStorage(uuid!, database),
    enabled: enabled && !!uuid,
  });

  return {
    bagStorageData: data ?? null,
    isLoading,
    error: error ?? null,
  };
}

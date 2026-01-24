'use client';

// File: /src/hooks/pureData/useFetchPreordersData.ts
// OPT-02: Uses React Query for caching and automatic refetch.

import { useQuery } from '@tanstack/react-query';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { PreorderNightData } from '../../types/preorder';
import useUuid from '../useUuid';

type PreorderEntry = Omit<PreorderNightData, 'id'> & { id: string };

/**
 * Fetch occupant preorders from Firebase:
 *   preorder/{uuid} → { nightKey: PreorderNightData }
 */
async function fetchPreorders(
  database: ReturnType<typeof import('firebase/database').getDatabase>,
  uuid: string,
): Promise<PreorderEntry[]> {
  try {
    const preordersRef = ref(database, `preorder/${uuid}`);
    const snapshot = await get(preordersRef);
    if (!snapshot.exists()) {
      return [];
    }
    const data = snapshot.val() as Record<string, PreorderNightData>;
    return Object.entries(data).map(([nightKey, orderDetails]) => ({
      night: orderDetails.night,
      breakfast: orderDetails.breakfast,
      drink1: orderDetails.drink1,
      drink2: orderDetails.drink2,
      id: nightKey,
    }));
  } catch (err) {
    logger.error('Error fetching preordersData:', err);
    throw err;
  }
}

export function useFetchPreordersData() {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const { data, isLoading, error, refetch: rqRefetch } = useQuery({
    queryKey: ['preorders', uuid],
    queryFn: () => fetchPreorders(database, uuid!),
    enabled: !!uuid,
    // Preorders can change more frequently (guest places orders)
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    preordersData: data ?? [],
    isLoading,
    error: error ?? null,
    refetch: async () => { await rqRefetch(); },
  };
}

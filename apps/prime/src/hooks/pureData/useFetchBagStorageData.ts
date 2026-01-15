'use client';

// /src/hooks/pureData/useFetchBagStorageData.ts

import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { BagStorageRecord } from '../../types/bagStorage';
import useUuid from '../useUuid';

/**
 * Return type definition for this hook.
 * bagStorageData: occupant's bag storage info (or null if not found).
 * isLoading: indicates if the fetch is in progress.
 * error: holds any error encountered during fetch.
 */
interface UseFetchBagStorageDataReturn {
  bagStorageData: BagStorageRecord | null;
  isLoading: boolean;
  error: unknown;
}

/**
 * Pure Data Hook:
 * Fetches bag storage information from Firebase for the occupant's UUID.
 * Uses useFirebaseDatabase to retrieve the Firebase Database instance.
 */
export function useFetchBagStorageData(): UseFetchBagStorageDataReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();
  const [bagStorageData, setBagStorageData] = useState<BagStorageRecord | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!uuid) {
      setIsLoading(false);
      return;
    }

    const bagStorageRef = ref(database, `bagStorage/${uuid}`);
    get(bagStorageRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val() as BagStorageRecord;
          setBagStorageData(data);
        } else {
          setBagStorageData(null);
        }
      })
      .catch((err) => {
        logger.error('Error fetching bagStorageData:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [uuid, database]);

  return { bagStorageData, isLoading, error };
}

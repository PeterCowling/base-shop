'use client';

/* File: /src/hooks/pureData/useFetchLoans.ts
   Explanation:
   - Added a `refetch` function that manually reloads the occupant's loans.
   - Wrapped the fetching logic in a `loadData` callback to be used both in the effect and in `refetch`.
   - Ensured that all return types are strongly typed, with no use of `any`.
*/

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { LoanOccupantRecord } from '../../types/loans';
import useUuid from '../useUuid';

/**
 * Helper function to fetch occupant loan transactions from "loans/{occupantId}".
 * Returns the occupant's loan record or null if not found.
 */
async function fetchLoansForOccupant(
  occupantId: string,
  database: Database,
): Promise<LoanOccupantRecord | null> {
  if (!occupantId) {
    return null;
  }
  try {
    const snapshot = await get(ref(database, `loans/${occupantId}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as LoanOccupantRecord;
  } catch (error) {
    logger.error('Error fetching loans data:', error);
    throw error;
  }
}

/**
 * useFetchLoans
 * A "Pure Data" hook to retrieve an occupant's loan transactions from Firebase.
 *
 * @returns { data, error, isLoading, isError, refetch }
 */
export function useFetchLoans() {
  const occupantId: string = useUuid();
  const database: Database = useFirebaseDatabase();
  const [data, setData] = useState<LoanOccupantRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Centralized function to load data
  const loadData = useCallback(async (): Promise<void> => {
    if (!occupantId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchLoansForOccupant(occupantId, database);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [occupantId, database]);

  useEffect(() => {
    // Immediately load data on mount or when dependencies change
    loadData().catch(() => {
      // Error is already handled in loadData
    });
  }, [loadData]);

  // Refetch function to allow manual reloading of data
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

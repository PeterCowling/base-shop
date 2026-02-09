'use client';

// File: /src/hooks/pureData/useFetchLoans.ts
// OPT-02/03: React Query with deferred loading support.

import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { LoanOccupantRecord } from '../../types/loans';
import useUuid from '../useUuid';

/**
 * Fetch occupant loan transactions from "loans/{occupantId}".
 */
async function fetchLoansForOccupant(
  occupantId: string,
  database: Database,
): Promise<LoanOccupantRecord | null> {
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

interface UseFetchLoansOptions {
  enabled?: boolean;
}

export function useFetchLoans(options: UseFetchLoansOptions = {}) {
  const { enabled = true } = options;
  const occupantId = useUuid();
  const database = useFirebaseDatabase();

  const { data, error, isLoading, refetch: rqRefetch } = useQuery({
    queryKey: ['loans', occupantId],
    queryFn: () => fetchLoansForOccupant(occupantId!, database),
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

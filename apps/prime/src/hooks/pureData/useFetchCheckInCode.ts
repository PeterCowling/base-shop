/**
 * useFetchCheckInCode
 *
 * Pure Data hook to retrieve check-in code via the CF Pages Function proxy.
 * Routes through GET /api/check-in-code?uuid=<uuid> — the prime_session HttpOnly
 * cookie is sent automatically by the browser on this same-origin request.
 *
 * Uses React Query for caching with:
 * - Stale time: 5 minutes (codes don't change once generated)
 * - Cache time: 30 minutes
 */

import { useQuery } from '@tanstack/react-query';

import logger from '@acme/lib/logger/client';

import type { CheckInCodeRecord } from '../../types/checkInCode';
import useUuid from '../useUuid';

/**
 * Fetch check-in code via the CF Pages Function proxy.
 * Returns null if the code doesn't exist, is expired, or the guest is not authenticated.
 */
async function fetchCheckInCodeViaApi(uuid: string): Promise<CheckInCodeRecord | null> {
  if (!uuid) {
    return null;
  }

  try {
    const response = await fetch(`/api/check-in-code?uuid=${encodeURIComponent(uuid)}`);

    if (response.status === 401 || response.status === 403) {
      // Guest session cookie not present or expired — treat as no code
      return null;
    }

    if (!response.ok) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    const data = (await response.json()) as { code: string | null; expiresAt?: number; expired?: boolean };

    if (!data.code || data.expired) {
      return null;
    }

    return {
      code: data.code,
      uuid,
      createdAt: 0, // Not returned by API; only code and expiresAt are needed by callers
      expiresAt: data.expiresAt ?? 0,
    };
  } catch (error) {
    logger.error('[useFetchCheckInCode] Error fetching check-in code via API:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    throw error;
  }
}

/**
 * Options for useFetchCheckInCode hook.
 */
export interface UseFetchCheckInCodeOptions {
  /** Whether to enable the query (default: true). */
  enabled?: boolean;
}

/**
 * Result from useFetchCheckInCode.
 */
export interface UseFetchCheckInCodeResult {
  /** Check-in code record (null if not found or expired) */
  data: CheckInCodeRecord | null;
  /** Error if fetch failed */
  error: Error | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** The code string itself (convenience accessor) */
  code: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * useFetchCheckInCode
 *
 * Fetches check-in code for the current guest via the CF Function proxy.
 */
export function useFetchCheckInCode(
  options: UseFetchCheckInCodeOptions = {},
): UseFetchCheckInCodeResult {
  const { enabled = true } = options;
  const uuid = useUuid();

  const {
    data,
    error,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['checkInCode', uuid],
    queryFn: () => fetchCheckInCodeViaApi(uuid ?? ''),
    enabled: !!uuid && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const refetch = async (): Promise<void> => {
    await refetchQuery();
  };

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    code: data?.code ?? null,
    refetch,
  };
}

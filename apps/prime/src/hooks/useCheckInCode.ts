/**
 * useCheckInCode
 *
 * Hook that manages check-in code retrieval and generation.
 * Automatically generates a code if one doesn't exist and
 * the guest is in pre-arrival or arrival-day state.
 * Supports offline mode with localStorage caching.
 */

import { useCallback, useEffect, useState } from 'react';

import { cacheCheckInCode, getCachedCheckInCode } from '../lib/arrival/codeCache';
import { useOnlineStatus } from '../lib/pwa/useOnlineStatus';

import { useFetchCheckInCode } from './pureData/useFetchCheckInCode';
import useUuid from './useUuid';

interface UseCheckInCodeOptions {
  /** Check-out date (ISO format YYYY-MM-DD) - required for code generation */
  checkOutDate: string | undefined;
  /** Whether to auto-generate if missing (default: true) */
  autoGenerate?: boolean;
  /** Whether to enable the hook (default: true) */
  enabled?: boolean;
}

interface UseCheckInCodeReturn {
  /** The check-in code string (e.g., "BRK-A7K9M") */
  code: string | null;
  /** Loading state (fetching or generating) */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error message if any */
  errorMessage: string | null;
  /** Whether the code is from cache and may be outdated */
  isStale: boolean;
  /** Whether the device is currently offline */
  isOffline: boolean;
  /** Manually trigger code generation */
  generateCode: () => Promise<void>;
  /** Refetch code from database */
  refetch: () => Promise<void>;
}

/**
 * useCheckInCode
 *
 * Fetches and manages check-in code for the current guest.
 * Automatically triggers code generation if missing.
 */
export function useCheckInCode(options: UseCheckInCodeOptions): UseCheckInCodeReturn {
  const { checkOutDate, autoGenerate = true, enabled = true } = options;

  const uuid = useUuid();
  const isOnline = useOnlineStatus();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [cachedCode, setCachedCode] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Fetch existing code (only when online and enabled)
  const {
    code,
    isLoading: isFetching,
    isError: isFetchError,
    error: fetchError,
    refetch,
  } = useFetchCheckInCode({ enabled: enabled && isOnline });

  // Cache successful code fetches
  useEffect(() => {
    if (code && uuid && isOnline) {
      cacheCheckInCode(code, uuid);
      setCachedCode(code);
      setIsStale(false);
    }
  }, [code, uuid, isOnline]);

  // Load cached code when offline
  useEffect(() => {
    if (!isOnline && uuid && !cachedCode) {
      const cached = getCachedCheckInCode(uuid);
      if (cached) {
        setCachedCode(cached.code);
        setIsStale(true);
      }
    }
  }, [isOnline, uuid, cachedCode]);

  /**
   * Generate a new check-in code via API.
   * Disabled when offline.
   */
  const generateCode = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      setGenerateError('Cannot generate code while offline');
      return;
    }

    if (!uuid || !checkOutDate) {
      setGenerateError('Missing uuid or checkOutDate');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/check-in-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid, checkOutDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      // Refetch to get the new code
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [isOnline, uuid, checkOutDate, refetch]);

  // Auto-generate code if missing and enabled
  useEffect(() => {
    if (
      enabled &&
      autoGenerate &&
      !code &&
      !isFetching &&
      !isGenerating &&
      uuid &&
      checkOutDate &&
      isOnline
    ) {
      void generateCode();
    }
  }, [enabled, autoGenerate, code, isFetching, isGenerating, uuid, checkOutDate, isOnline, generateCode]);

  const isLoading = isFetching || isGenerating;
  const isError = isFetchError || generateError !== null;
  const errorMessage = generateError || (fetchError?.message ?? null);

  // Use cached code when offline, otherwise use fresh code
  const displayCode = !isOnline && cachedCode ? cachedCode : code;

  return {
    code: displayCode,
    isLoading,
    isError,
    errorMessage,
    isStale,
    isOffline: !isOnline,
    generateCode,
    refetch,
  };
}

export default useCheckInCode;

/**
 * useCheckInCode
 *
 * Hook that manages check-in code retrieval and generation.
 * Automatically generates a code if one doesn't exist and
 * the guest is in pre-arrival or arrival-day state.
 */

import { useCallback, useEffect, useState } from 'react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Fetch existing code
  const {
    code,
    isLoading: isFetching,
    isError: isFetchError,
    error: fetchError,
    refetch,
  } = useFetchCheckInCode({ enabled });

  /**
   * Generate a new check-in code via API.
   */
  const generateCode = useCallback(async (): Promise<void> => {
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
  }, [uuid, checkOutDate, refetch]);

  // Auto-generate code if missing and enabled
  useEffect(() => {
    if (
      enabled &&
      autoGenerate &&
      !code &&
      !isFetching &&
      !isGenerating &&
      uuid &&
      checkOutDate
    ) {
      void generateCode();
    }
  }, [enabled, autoGenerate, code, isFetching, isGenerating, uuid, checkOutDate, generateCode]);

  const isLoading = isFetching || isGenerating;
  const isError = isFetchError || generateError !== null;
  const errorMessage = generateError || (fetchError?.message ?? null);

  return {
    code,
    isLoading,
    isError,
    errorMessage,
    generateCode,
    refetch,
  };
}

export default useCheckInCode;

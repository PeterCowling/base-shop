/**
 * usePreArrivalMutator
 *
 * Mutator hook for updating pre-arrival data in Firebase.
 * Path: preArrival/{uuid}
 *
 * Provides methods to:
 * - Update checklist progress
 * - Set ETA information
 * - Mark cash readiness
 * - Save route selection
 */

import { useQueryClient } from '@tanstack/react-query';
import { ref, update } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type {
  ChecklistProgress,
  EtaMethod,
  PreArrivalData,
} from '../../types/preArrival';
import useUuid from '../useUuid';

/**
 * Return type for usePreArrivalMutator.
 */
export interface UsePreArrivalMutatorReturn {
  /** Update a single checklist item */
  updateChecklistItem: (
    item: keyof ChecklistProgress,
    completed: boolean,
  ) => Promise<void>;
  /** Update multiple checklist items at once */
  updateChecklistItems: (
    updates: Partial<ChecklistProgress>,
  ) => Promise<void>;
  /** Set ETA information */
  setEta: (
    window: string | null,
    method: EtaMethod | null,
    note?: string,
  ) => Promise<void>;
  /** Mark cash readiness for city tax */
  setCashReadyCityTax: (ready: boolean) => Promise<void>;
  /** Mark cash readiness for deposit */
  setCashReadyDeposit: (ready: boolean) => Promise<void>;
  /** Save a route slug */
  saveRoute: (routeSlug: string | null) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Success state */
  isSuccess: boolean;
  /** Last error message */
  errorMessage: string | null;
}

/**
 * usePreArrivalMutator
 *
 * Hook for mutating pre-arrival data in Firebase.
 * All updates are partial and merged with existing data.
 */
export function usePreArrivalMutator(): UsePreArrivalMutatorReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Internal helper to update pre-arrival data.
   */
  const updatePreArrivalData = useCallback(
    async (updates: Partial<PreArrivalData>): Promise<void> => {
      if (!uuid) {
        logger.warn('[usePreArrivalMutator] Missing uuid');
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setErrorMessage(null);

      try {
        const preArrivalRef = ref(database, `preArrival/${uuid}`);
        await update(preArrivalRef, {
          ...updates,
          updatedAt: Date.now(),
        });

        // Invalidate the query cache to trigger refetch
        await queryClient.invalidateQueries({
          queryKey: ['preArrivalData', uuid],
        });

        setIsSuccess(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[usePreArrivalMutator] Error updating pre-arrival data:', error);
        setIsError(true);
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database, queryClient],
  );

  /**
   * Update a single checklist item.
   */
  const updateChecklistItem = useCallback(
    async (item: keyof ChecklistProgress, completed: boolean): Promise<void> => {
      await updatePreArrivalData({
        checklistProgress: {
          [item]: completed,
        } as Partial<ChecklistProgress>,
      } as Partial<PreArrivalData>);
    },
    [updatePreArrivalData],
  );

  /**
   * Update multiple checklist items at once.
   */
  const updateChecklistItems = useCallback(
    async (updates: Partial<ChecklistProgress>): Promise<void> => {
      // For Firebase, we need to use dot notation for nested updates
      const flatUpdates: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(updates)) {
        flatUpdates[`checklistProgress/${key}`] = value;
      }

      if (!uuid) {
        logger.warn('[usePreArrivalMutator] Missing uuid');
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setErrorMessage(null);

      try {
        const preArrivalRef = ref(database, `preArrival/${uuid}`);
        await update(preArrivalRef, {
          ...flatUpdates,
          updatedAt: Date.now(),
        });

        await queryClient.invalidateQueries({
          queryKey: ['preArrivalData', uuid],
        });

        setIsSuccess(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[usePreArrivalMutator] Error updating checklist:', error);
        setIsError(true);
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database, queryClient],
  );

  /**
   * Set ETA information.
   */
  const setEta = useCallback(
    async (
      window: string | null,
      method: EtaMethod | null,
      note = '',
    ): Promise<void> => {
      await updatePreArrivalData({
        etaWindow: window,
        etaMethod: method,
        etaNote: note.slice(0, 200), // Enforce max length
        etaConfirmedAt: window ? Date.now() : null,
      });

      // Also mark etaConfirmed in checklist if ETA is set
      if (window) {
        await updateChecklistItem('etaConfirmed', true);
      }
    },
    [updatePreArrivalData, updateChecklistItem],
  );

  /**
   * Mark cash readiness for city tax.
   */
  const setCashReadyCityTax = useCallback(
    async (ready: boolean): Promise<void> => {
      await updatePreArrivalData({
        cashReadyCityTax: ready,
      });
    },
    [updatePreArrivalData],
  );

  /**
   * Mark cash readiness for deposit.
   */
  const setCashReadyDeposit = useCallback(
    async (ready: boolean): Promise<void> => {
      await updatePreArrivalData({
        cashReadyDeposit: ready,
      });
    },
    [updatePreArrivalData],
  );

  /**
   * Save a route slug.
   */
  const saveRoute = useCallback(
    async (routeSlug: string | null): Promise<void> => {
      await updatePreArrivalData({
        routeSaved: routeSlug,
      });

      // Mark routePlanned if a route is saved
      if (routeSlug) {
        await updateChecklistItem('routePlanned', true);
      }
    },
    [updatePreArrivalData, updateChecklistItem],
  );

  return {
    updateChecklistItem,
    updateChecklistItems,
    setEta,
    setCashReadyCityTax,
    setCashReadyDeposit,
    saveRoute,
    isLoading,
    isError,
    isSuccess,
    errorMessage,
  };
}

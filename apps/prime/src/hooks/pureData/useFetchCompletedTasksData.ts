'use client';

// src/hooks/pureData/useFetchCompletedTasksData.ts

import { useEffect, useRef, useState } from 'react';

import { get, onValue, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import useUuid from '../useUuid';

export interface UseFetchCompletedTasksResult {
  /** The occupant-scoped UUID returned by `useUuid()` (may be `null`). */
  uuid: string | null;
  /** Realtime snapshot of `/completedTasks/{uuid}` (empty object if none). */
  occupantTasks: OccupantCompletedTasks;
  /** `true` while the listener is attaching *or* UUID resolution is pending. */
  isLoading: boolean;
  /** `true` if Firebase returned an error when attaching the listener. */
  isError: boolean;
  /**
   * `true` when the hook gave up waiting for a UUID (after the grace period)
   * and therefore never attached the listener.
   */
  isUuidMissing: boolean;
}

/**
 * useFetchCompletedTasks
 *
 * Realtime listener for `completedTasks/{uuid}` with "smart" UUID handling:
 * - Waits a short grace period for `uuid` to resolve before warning.
 * - Distinguishes between *loading*, *error*, and *uuid-missing* states.
 */
export function useFetchCompletedTasks(): UseFetchCompletedTasksResult {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const [occupantTasks, setOccupantTasks] = useState<OccupantCompletedTasks>(
    {},
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isUuidMissing, setIsUuidMissing] = useState<boolean>(false);

  const shouldUseOneShotRead =
    typeof window !== 'undefined' && Boolean((window as { Cypress?: unknown }).Cypress);

  // Keep the grace-period timer stable across renders.
  const warnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /** Clears (and nulls) the existing warn-timer if present. */
    const clearWarnTimer = () => {
      if (warnTimeoutRef.current) {
        clearTimeout(warnTimeoutRef.current);
        warnTimeoutRef.current = null;
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Case 1: UUID *not yet* available – allow a grace period.
    // ──────────────────────────────────────────────────────────────────────────
    if (!uuid) {
      if (!warnTimeoutRef.current) {
        warnTimeoutRef.current = setTimeout(() => {
          // eslint-disable-next-line ds/no-hardcoded-copy -- BRIK-ENG-0017 internal diagnostic log
          logger.warn('[useFetchCompletedTasks] UUID still unavailable after 1.5 s; listener not attached. ');
          setIsLoading(false);
          setIsUuidMissing(true);
        }, 1500);
      }
      return () => {
        /* nothing to clean up – no listener attached */
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Case 2: UUID *is* available in Cypress e2e – use one-shot read.
    // Avoid websocket-based listeners in browser E2E to keep tests deterministic.
    // ──────────────────────────────────────────────────────────────────────────
    if (shouldUseOneShotRead) {
      clearWarnTimer();
      setIsUuidMissing(false);
      setIsLoading(true);
      setIsError(false);

      let isActive = true;

      void get(ref(database, `completedTasks/${uuid}`))
        .then((snapshot) => {
          if (!isActive) return;
          if (snapshot.exists()) {
            setOccupantTasks(snapshot.val() as OccupantCompletedTasks);
          } else {
            setOccupantTasks({});
          }
          setIsLoading(false);
          setIsError(false);
        })
        .catch((error) => {
          if (!isActive) return;
          // eslint-disable-next-line ds/no-hardcoded-copy -- BRIK-ENG-0017 internal diagnostic log
          logger.error('[useFetchCompletedTasks] Firebase one-shot error:', error);
          setIsError(true);
          setIsLoading(false);
        });

      return () => {
        isActive = false;
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Case 3: UUID *is* available – attach realtime listener.
    // ──────────────────────────────────────────────────────────────────────────
    clearWarnTimer(); // Cancel any pending warning.
    setIsUuidMissing(false);
    setIsLoading(true);
    setIsError(false);

    const tasksRef = ref(database, `completedTasks/${uuid}`);

    const unsubscribe = onValue(
      tasksRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOccupantTasks(snapshot.val() as OccupantCompletedTasks);
        } else {
          setOccupantTasks({});
        }
        setIsLoading(false);
        setIsError(false);
      },
      (error) => {
        // eslint-disable-next-line ds/no-hardcoded-copy -- BRIK-ENG-0017 internal diagnostic log
        logger.error('[useFetchCompletedTasks] Firebase listener error:', error);
        setIsError(true);
        setIsLoading(false);
      },
    );

    // Cleanup: detach the listener when UUID or component changes.
    return () => {
      unsubscribe();
    };
  }, [uuid, database, shouldUseOneShotRead]);

  // Ensure the warn-timer is cleared on unmount.
  useEffect(
    () => () => {
      if (warnTimeoutRef.current) {
        clearTimeout(warnTimeoutRef.current);
      }
    },
    [],
  );

  return {
    uuid,
    occupantTasks,
    isLoading,
    isError,
    isUuidMissing,
  };
}

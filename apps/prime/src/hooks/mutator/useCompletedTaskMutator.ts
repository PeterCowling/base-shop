'use client';

import { useCallback, useState } from 'react';

import logger from '@acme/lib/logger/client';

import { ref, update } from '@/services/firebase';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import useUuid from '../useUuid';

/**
 * A partial representation of an occupant's completed tasks.
 */
export type CompletedTasksPayload = Partial<OccupantCompletedTasks>;

interface UseCompletedTaskMutatorProps {
  [key: string]: unknown;
}

export interface UseCompletedTaskMutatorReturn
  extends UseCompletedTaskMutatorProps {
  completeTask: (taskId: string, status: boolean) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export function useCompletedTaskMutator(
  props: UseCompletedTaskMutatorProps = {},
): UseCompletedTaskMutatorReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const prepareDataForDB = useCallback(
    (taskId: string, status: boolean): CompletedTasksPayload => ({
      [taskId]: status ? 'true' : 'false',
    }),
    [],
  );

  const completeTask = useCallback(
    async (taskId: string, status: boolean) => {
      if (!uuid || !taskId) {
        logger.warn('[useCompletedTaskMutator] Missing uuid or taskId:', { // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
          uuid,
          taskId,
        });
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      try {
        const payload = prepareDataForDB(taskId, status);

        const tasksRef = ref(database, `completedTasks/${uuid}`);
        await update(tasksRef, payload);

        setIsSuccess(true);
      } catch (error) {
        logger.error('[useCompletedTaskMutator] Error in completeTask:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database, prepareDataForDB],
  );

  return { completeTask, isLoading, isError, isSuccess, ...props };
}

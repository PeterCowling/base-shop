/**
 * useHomePageVisibility.ts
 *
 * Orchestrates the data and logic required for the HomePage.
 * Determines which components (DoList tasks, Service cards) should be visible
 * based on the occupant's data, eligibility for certain features, and task completion status.
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getServicesConfig,
  type ServiceCardData,
} from '../../config/homepage/servicesConfig';
import { getTasks, type TaskItem } from '../../config/homepage/tasksConfig';
import { type UnifiedOccupantData,useUnifiedBookingData } from '../../hooks/dataOrchestrator/useUnifiedBookingData';
import { useCompletedTaskMutator } from '../../hooks/mutator/useCompletedTaskMutator';

import type { DoListTask } from './DoList';

function transformTasks(rawTasks: TaskItem[]): DoListTask[] {
  return rawTasks.map((task) => ({
    id: task.id,
    image: task.image || '',
    to: task.to || '',
    isStandard: task.isStandard,
  }));
}

interface Eligibility {
  isEligibleForComplimentaryBreakfast: boolean;
  isEligibleForEveningDrink: boolean;
}

export interface UseHomePageVisibilityReturn {
  occupantLoading: boolean;
  occupantError: unknown;
  occupantData: UnifiedOccupantData | null;
  occupantId: string | null;
  eligibility: Eligibility | null;
  isTaskCompleted: (taskId: string) => boolean;
  handleTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;
  allTasksCompleted: boolean;
  filteredTasks: DoListTask[];
  serviceCards: ServiceCardData[];
}

/**
 * useHomePageVisibility (Domain):
 * Centralizes occupant data and eligibility checks for the HomePage.
 * Returns loading/error states, occupant data, and computed arrays for tasks/services.
 */
export function useHomePageVisibility(): UseHomePageVisibilityReturn {
  const { t: _t } = useTranslation('Homepage');

  // 1) Fetch occupant data from the unified booking data hook
  const {
    occupantData,
    occupantId,
    isLoading: occupantLoadingBasic,
    error: occupantError,
    eligibility: occupantEligibility,
  } = useUnifiedBookingData();

  // 2) Completed Task Mutator
  const { completeTask } = useCompletedTaskMutator({});

  /**
   * 3) Derive occupantRoom number if possible
   */
  const occupantAllocatedRoomNumber = useMemo(() => {
    const rawRoom = occupantData?.allocatedRoom ?? '';
    const parsed = parseInt(rawRoom, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [occupantData]);

  /**
   * 4) Normalize eligibility booleans once for all downstream consumers.
   */
  const safeEligibility = useMemo<Eligibility | null>(() => {
    if (!occupantEligibility) return null;
    return {
      isEligibleForComplimentaryBreakfast:
        occupantEligibility.isEligibleForComplimentaryBreakfast || false,
      isEligibleForEveningDrink:
        occupantEligibility.isEligibleForEveningDrink || false,
    };
  }, [occupantEligibility]);

  /**
   * 5a) Build tasks from config, factoring occupant's eligibility/room.
   */
  const tasks = useMemo(() => {
    if (!safeEligibility) return [];
    const safeOccupantId = occupantId ?? '';
    const rawTasks = getTasks(
      safeOccupantId,
      safeEligibility,
      occupantAllocatedRoomNumber,
    );
    return transformTasks(rawTasks);
  }, [safeEligibility, occupantAllocatedRoomNumber, occupantId]);

  /**
   * 5b) occupantTasks are the occupant's recorded completions.
   */
  const occupantTasks = useMemo(() => {
    return occupantData?.completedTasks || {};
  }, [occupantData]);

  /**
   * 6) Helper to check if a task is completed.
   */
  const isTaskCompleted = useCallback(
    (taskId: string) => occupantTasks[taskId] === 'true',
    [occupantTasks],
  );

  /**
   * 7) Filter tasks to see if occupant has completed them all.
   */
  const relevantTasksForCompletionCheck = useMemo(() => {
    if (!safeEligibility) return [];
    const isEligible = safeEligibility.isEligibleForComplimentaryBreakfast;
    return tasks.filter((task) => {
      if (task.id === 'complimentaryBreakfast' && !isEligible) return false;
      if (task.id === 'exploreBreakfastMenu' && isEligible) return false;
      return true;
    });
  }, [tasks, safeEligibility]);

  const allTasksCompleted = useMemo(() => {
    if (!relevantTasksForCompletionCheck.length) return false;
    return relevantTasksForCompletionCheck.every((task) =>
      isTaskCompleted(task.id),
    );
  }, [relevantTasksForCompletionCheck, isTaskCompleted]);

  /**
   * 8) Filter for only the tasks occupant still needs to see/do.
   */
  const filteredTasks = useMemo(() => {
    return relevantTasksForCompletionCheck.filter((task) => !isTaskCompleted(task.id));
  }, [relevantTasksForCompletionCheck, isTaskCompleted]);

  /**
   * 9) Service cards from config – no additional logic except passing completions.
   */
  const serviceCards = useMemo(() => {
    if (!safeEligibility) return [];
    const completedIds = Object.keys(occupantTasks).filter(
      (k) => occupantTasks[k] === 'true',
    );
    return getServicesConfig(occupantId ?? '', safeEligibility, completedIds);
  }, [safeEligibility, occupantTasks, occupantId]);

  /**
   * 10) Public method to mark a task completed.
   */
  const handleTaskCompletion = useCallback(
    async (taskId: string, completed: boolean) => {
      await completeTask(taskId, completed);
    },
    [completeTask],
  );

  /**
   * 11) Refine occupantLoading so we don't briefly show "missing data"
   */
  const occupantDataReady = occupantData && occupantId && occupantEligibility;
  const occupantLoading = occupantLoadingBasic || !occupantDataReady;

  return {
    occupantLoading,
    occupantError,
    occupantData: occupantData ?? null,
    occupantId: occupantId ?? null,
    eligibility: safeEligibility,
    isTaskCompleted,
    handleTaskCompletion,
    allTasksCompleted,
    filteredTasks,
    serviceCards,
  };
}

/**
 * readinessScore.ts
 *
 * Pure functions for computing guest readiness score from checklist progress.
 * Score is computed on read, never stored - ensures consistency.
 */

import type { ChecklistProgress } from '../../types/preArrival';
import { CHECKLIST_WEIGHTS } from '../../types/preArrival';

/**
 * Compute the readiness score from checklist progress.
 *
 * Score ranges from 0-100 based on weighted item completion.
 * This is a pure function - compute on read, don't store the result.
 *
 * @param checklist - Current checklist progress state
 * @returns Score from 0-100
 */
export function computeReadinessScore(checklist: ChecklistProgress): number {
  return Object.entries(checklist).reduce((score, [key, completed]) => {
    const weight = CHECKLIST_WEIGHTS[key as keyof ChecklistProgress] ?? 0;
    return score + (completed ? weight : 0);
  }, 0);
}

/**
 * Get the count of completed checklist items.
 *
 * @param checklist - Current checklist progress state
 * @returns Number of completed items (0-5)
 */
export function getCompletedCount(checklist: ChecklistProgress): number {
  return Object.values(checklist).filter(Boolean).length;
}

/**
 * Get the total number of checklist items.
 * Currently always 5, but this function allows for future flexibility.
 */
export function getTotalChecklistItems(): number {
  return Object.keys(CHECKLIST_WEIGHTS).length;
}

/**
 * Check if all checklist items are complete.
 *
 * @param checklist - Current checklist progress state
 * @returns true if all items are complete
 */
export function isChecklistComplete(checklist: ChecklistProgress): boolean {
  return getCompletedCount(checklist) === getTotalChecklistItems();
}

/**
 * Get the next uncompleted checklist item in priority order.
 *
 * Priority order (based on what's most helpful to complete first):
 * 1. routePlanned - Know how to get there
 * 2. etaConfirmed - Tell hostel when arriving
 * 3. cashPrepared - Have cash ready
 * 4. rulesReviewed - Know the house rules
 * 5. locationSaved - Have directions saved
 *
 * @param checklist - Current checklist progress state
 * @returns The key of the next item to complete, or null if all done
 */
export function getNextChecklistItem(
  checklist: ChecklistProgress,
): keyof ChecklistProgress | null {
  const priorityOrder: (keyof ChecklistProgress)[] = [
    'routePlanned',
    'etaConfirmed',
    'cashPrepared',
    'rulesReviewed',
    'locationSaved',
  ];

  for (const item of priorityOrder) {
    if (!checklist[item]) {
      return item;
    }
  }

  return null;
}

/**
 * Get a readiness level based on score.
 * Useful for UI treatment (colors, messaging).
 */
export type ReadinessLevel = 'not-started' | 'in-progress' | 'almost-ready' | 'ready';

export function getReadinessLevel(score: number): ReadinessLevel {
  if (score === 0) return 'not-started';
  if (score < 50) return 'in-progress';
  if (score < 100) return 'almost-ready';
  return 'ready';
}

/**
 * Get human-readable status message based on readiness level.
 * Returns translation key for i18n.
 */
export function getReadinessMessageKey(level: ReadinessLevel): string {
  switch (level) {
    case 'not-started':
      return 'readiness.status.notStarted';
    case 'in-progress':
      return 'readiness.status.inProgress';
    case 'almost-ready':
      return 'readiness.status.almostReady';
    case 'ready':
      return 'readiness.status.ready';
    default:
      return 'readiness.status.inProgress';
  }
}

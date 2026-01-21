/**
 * initializeQuestProgress.ts
 *
 * Helper function to bootstrap quest progress for existing or returning occupants.
 * Pre-credits tasks that are already in completedTasks.
 */

import type { OccupantCompletedTasks } from '../../types/completedTasks';
import type { QuestProgress } from '../../types/questProgress';
import { DEFAULT_QUEST_PROGRESS } from '../../types/questProgress';

/**
 * Tasks that contribute to quest tier completion.
 * These are the task IDs from completedTasks that matter for quests.
 */
const QUEST_RELEVANT_TASKS = [
  'welcome',
  'featuresIntro',
  'mainDoorAccess',
  'complimentaryEveningDrink',
  'activityJoined',
  'guidebookVisited',
  'localSpotVisited',
  'profileOnboardingComplete',
] as const;

/**
 * Tier definitions for checking if a tier is already complete.
 */
const TIER_REQUIREMENTS: Record<string, string[]> = {
  'settle-in': ['welcome', 'featuresIntro', 'mainDoorAccess'],
};

/**
 * Check if a tier's requirements are met by completed tasks.
 */
function isTierComplete(
  tierId: string,
  completedTasks: OccupantCompletedTasks,
): boolean {
  const requirements = TIER_REQUIREMENTS[tierId];
  if (!requirements) return false;

  return requirements.every((taskId) => completedTasks[taskId] === 'true');
}

/**
 * Initialize quest progress for a new booking.
 *
 * This function:
 * 1. Creates fresh quest progress with the current bookingId and checkInDate
 * 2. Pre-credits any tiers that are already complete based on completedTasks
 *
 * @param bookingId - The current booking's ID
 * @param checkInDate - The check-in date (ISO string)
 * @param completedTasks - The occupant's current completedTasks record
 * @returns Fresh QuestProgress with pre-credited tiers
 */
export function initializeQuestProgressFromCompletedTasks(
  bookingId: string,
  checkInDate: string,
  completedTasks: OccupantCompletedTasks = {},
): QuestProgress {
  const now = Date.now();
  const completedTiers: string[] = [];
  const tierCompletedAt: Record<string, number> = {};

  // Check each tier and pre-credit if requirements are met
  for (const tierId of Object.keys(TIER_REQUIREMENTS)) {
    if (isTierComplete(tierId, completedTasks)) {
      completedTiers.push(tierId);
      tierCompletedAt[tierId] = now;
    }
  }

  // Determine current tier (first incomplete tier, or last completed if all done)
  let currentTier = DEFAULT_QUEST_PROGRESS.currentTier;
  const tierOrder = ['settle-in', 'social-night', 'positano-explorer'];
  for (const tierId of tierOrder) {
    if (!completedTiers.includes(tierId)) {
      currentTier = tierId;
      break;
    }
  }

  return {
    bookingId,
    checkInDate,
    currentTier,
    completedTiers,
    tierCompletedAt,
  };
}

/**
 * Check if quest progress is stale (belongs to a different booking).
 *
 * @param progress - The stored quest progress
 * @param currentBookingId - The current booking's ID
 * @returns true if progress is stale and should be reset
 */
export function isQuestProgressStale(
  progress: QuestProgress | null,
  currentBookingId: string,
): boolean {
  if (!progress) return true;
  if (!progress.bookingId) return true;
  return progress.bookingId !== currentBookingId;
}

/**
 * computeQuestState.ts
 *
 * Pure function for computing quest state from input data.
 * No async operations or hooks - just deterministic computation.
 *
 * This is the core quest engine logic that determines:
 * - Current tier and progress
 * - Which tiers are available
 * - Next suggested action
 * - Total XP and badges
 */

import type { GuestProfile } from '../../types/guestProfile';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import type { QuestProgress } from '../../types/questProgress';
import {
  QUEST_TIERS,
  type QuestTier,
  getTierById,
  getBadgesFromTiers,
  getXpFromTiers,
  isTierUnlocked,
  getAvailableTiers,
  getNextTierId,
} from '../../config/quests/questTiers';

/**
 * Input data for quest state computation.
 */
export interface QuestStateInput {
  /** Completed tasks from Firebase */
  completedTasks: OccupantCompletedTasks | null;
  /** Guest profile (may be null if not set) */
  guestProfile: GuestProfile | null;
  /** Quest progress (may be null if not initialized) */
  questProgress: QuestProgress | null;
  /** Current time for time-based unlock calculations */
  currentTime: number;
}

/**
 * Task progress for a single tier.
 */
export interface TierTaskProgress {
  /** Task ID */
  taskId: string;
  /** Whether the task is complete */
  isComplete: boolean;
}

/**
 * Progress information for a specific tier.
 */
export interface TierProgress {
  /** Tier ID */
  tierId: string;
  /** Whether the tier is unlocked */
  isUnlocked: boolean;
  /** Whether the tier is completed */
  isCompleted: boolean;
  /** Number of completed tasks */
  completedCount: number;
  /** Total number of required tasks */
  totalCount: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Individual task progress */
  tasks: TierTaskProgress[];
  /** Time until unlock (null if already unlocked or no time requirement) */
  hoursUntilUnlock: number | null;
  /** Required previous tier (null if none) */
  requiredPreviousTier: string | null;
}

/**
 * Suggested next action for the user.
 */
export interface NextAction {
  /** Type of action */
  type: 'complete-task' | 'wait-for-unlock' | 'all-complete';
  /** Tier ID this action relates to */
  tierId?: string;
  /** Task ID to complete (if type is 'complete-task') */
  taskId?: string;
  /** Hours until unlock (if type is 'wait-for-unlock') */
  hoursRemaining?: number;
}

/**
 * Computed quest state output.
 */
export interface QuestState {
  /** Current active tier ID */
  currentTier: string;
  /** Tier the user is currently working on (may differ from currentTier if completed) */
  activeTier: string | null;
  /** Progress info for all tiers */
  tierProgress: Record<string, TierProgress>;
  /** Array of completed tier IDs */
  completedTiers: string[];
  /** Array of available (unlocked, not completed) tier IDs */
  availableTiers: string[];
  /** Suggested next action */
  nextAction: NextAction;
  /** Total XP earned */
  totalXp: number;
  /** Badges earned */
  badges: string[];
  /** Hours elapsed since check-in */
  hoursElapsed: number;
  /** Whether all quests are complete */
  allComplete: boolean;
}

/**
 * Check if a task is completed.
 */
function isTaskComplete(
  completedTasks: OccupantCompletedTasks | null,
  taskId: string,
): boolean {
  if (!completedTasks) return false;
  return completedTasks[taskId] === 'true';
}

/**
 * Compute progress for a single tier.
 */
function computeTierProgress(
  tier: QuestTier,
  completedTasks: OccupantCompletedTasks | null,
  completedTiers: string[],
  hoursElapsed: number,
): TierProgress {
  const tasks = tier.requiredTasks.map((taskId) => ({
    taskId,
    isComplete: isTaskComplete(completedTasks, taskId),
  }));

  const completedCount = tasks.filter((t) => t.isComplete).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isCompleted = completedTiers.includes(tier.id);
  const isUnlocked = isTierUnlocked(tier, completedTiers, hoursElapsed);

  // Calculate hours until unlock for time-based requirements
  let hoursUntilUnlock: number | null = null;
  if (!isUnlocked && tier.unlockCondition?.hoursAfterCheckIn) {
    const hoursRequired = tier.unlockCondition.hoursAfterCheckIn;
    if (hoursElapsed < hoursRequired) {
      hoursUntilUnlock = Math.ceil(hoursRequired - hoursElapsed);
    }
  }

  return {
    tierId: tier.id,
    isUnlocked,
    isCompleted,
    completedCount,
    totalCount,
    percentage,
    tasks,
    hoursUntilUnlock,
    requiredPreviousTier: tier.unlockCondition?.previousTier ?? null,
  };
}

/**
 * Determine the next action for the user.
 */
function computeNextAction(
  tierProgress: Record<string, TierProgress>,
  availableTiers: string[],
): NextAction {
  // If no available tiers, all quests are complete
  if (availableTiers.length === 0) {
    // Check if there are locked tiers with time requirements
    const lockedTiers = Object.values(tierProgress).filter(
      (tp) => !tp.isCompleted && !tp.isUnlocked && tp.hoursUntilUnlock !== null,
    );

    if (lockedTiers.length > 0) {
      // Find the one that unlocks soonest
      const soonest = lockedTiers.reduce((min, tp) =>
        (tp.hoursUntilUnlock ?? Infinity) < (min.hoursUntilUnlock ?? Infinity) ? tp : min,
      );

      return {
        type: 'wait-for-unlock',
        tierId: soonest.tierId,
        hoursRemaining: soonest.hoursUntilUnlock ?? 0,
      };
    }

    return { type: 'all-complete' };
  }

  // Find the first available tier and its first incomplete task
  for (const tierId of availableTiers) {
    const progress = tierProgress[tierId];
    if (progress) {
      const incompleteTask = progress.tasks.find((t) => !t.isComplete);
      if (incompleteTask) {
        return {
          type: 'complete-task',
          tierId,
          taskId: incompleteTask.taskId,
        };
      }
    }
  }

  // Fallback - shouldn't happen if data is consistent
  return { type: 'all-complete' };
}

/**
 * Calculate hours elapsed since check-in.
 */
function calculateHoursElapsed(checkInDate: string, currentTime: number): number {
  if (!checkInDate) return 0;

  try {
    const checkIn = new Date(checkInDate);
    // Set check-in to start of day (guests typically check in afternoon, but we count from day start)
    checkIn.setHours(0, 0, 0, 0);

    const elapsed = currentTime - checkIn.getTime();
    return Math.max(0, elapsed / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

/**
 * Compute the full quest state from input data.
 *
 * This is a pure function with no side effects. It takes all required
 * data as input and returns the computed quest state.
 *
 * @param input - All data needed for quest state computation
 * @returns Computed quest state
 */
export function computeQuestState(input: QuestStateInput): QuestState {
  const { completedTasks, questProgress, currentTime } = input;

  // Extract completed tiers from quest progress
  const completedTiers = questProgress?.completedTiers ?? [];
  const currentTier = questProgress?.currentTier ?? 'settle-in';
  const checkInDate = questProgress?.checkInDate ?? '';

  // Calculate hours elapsed since check-in
  const hoursElapsed = calculateHoursElapsed(checkInDate, currentTime);

  // Compute progress for all tiers
  const tierProgress: Record<string, TierProgress> = {};
  for (const tier of QUEST_TIERS) {
    tierProgress[tier.id] = computeTierProgress(
      tier,
      completedTasks,
      completedTiers,
      hoursElapsed,
    );
  }

  // Get available tiers (unlocked but not completed)
  const availableTiers = getAvailableTiers(completedTiers, hoursElapsed);

  // Determine active tier (first available, or null if all complete)
  const activeTier = availableTiers.length > 0 ? availableTiers[0] : null;

  // Compute next action
  const nextAction = computeNextAction(tierProgress, availableTiers);

  // Derive badges and XP from completed tiers
  const badges = getBadgesFromTiers(completedTiers);
  const totalXp = getXpFromTiers(completedTiers);

  // Check if all quests are complete
  const allComplete = completedTiers.length === QUEST_TIERS.length;

  return {
    currentTier,
    activeTier,
    tierProgress,
    completedTiers,
    availableTiers,
    nextAction,
    totalXp,
    badges,
    hoursElapsed,
    allComplete,
  };
}

/**
 * Check if a tier should be marked as complete based on completed tasks.
 *
 * This is used to detect when a tier has been completed but not yet
 * recorded in questProgress.
 *
 * @param tierId - The tier to check
 * @param completedTasks - Current completed tasks
 * @returns true if all required tasks for the tier are complete
 */
export function isTierReadyForCompletion(
  tierId: string,
  completedTasks: OccupantCompletedTasks | null,
): boolean {
  const tier = getTierById(tierId);
  if (!tier) return false;

  return tier.requiredTasks.every((taskId) => isTaskComplete(completedTasks, taskId));
}

/**
 * Get a list of tiers that are ready for completion but not yet recorded.
 *
 * @param completedTasks - Current completed tasks
 * @param completedTiers - Already completed tiers
 * @param hoursElapsed - Hours since check-in for unlock checks
 * @returns Array of tier IDs ready for completion
 */
export function getTiersReadyForCompletion(
  completedTasks: OccupantCompletedTasks | null,
  completedTiers: string[],
  hoursElapsed: number,
): string[] {
  return QUEST_TIERS.filter((tier) => {
    // Skip already completed tiers
    if (completedTiers.includes(tier.id)) return false;

    // Must be unlocked
    if (!isTierUnlocked(tier, completedTiers, hoursElapsed)) return false;

    // All tasks must be complete
    return isTierReadyForCompletion(tier.id, completedTasks);
  }).map((tier) => tier.id);
}

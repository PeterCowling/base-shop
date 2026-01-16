// /src/types/questProgress.ts

/**
 * Quest progress data stored per occupant in Firebase.
 * Path: questProgress/{uuid}
 *
 * Tracks quest tier completion for the current stay. The bookingId field
 * enables per-stay scoping - if the bookingId doesn't match the current
 * booking, the progress is considered stale and should be reset.
 *
 * Note: Badges and XP are derived from completedTiers using helper functions
 * in the quest config module - they are not stored separately to maintain
 * a single source of truth.
 */
import type { IndexedById } from './indexedById';

/**
 * Quest progress for a single occupant.
 *
 * @property bookingId - Links progress to specific stay for staleness detection
 * @property checkInDate - ISO date string copied from booking for time-based unlocks
 * @property currentTier - The tier the guest is currently working on
 * @property completedTiers - Array of tier IDs that have been completed
 * @property tierCompletedAt - Timestamps when each tier was completed
 */
export interface QuestProgress {
  bookingId: string;
  checkInDate: string;
  currentTier: string;
  completedTiers: string[];
  tierCompletedAt: Record<string, number>;
}

/**
 * Default values for quest progress.
 * Applied when progress is missing or stale.
 */
export const DEFAULT_QUEST_PROGRESS: QuestProgress = {
  bookingId: '',
  checkInDate: '',
  currentTier: 'settle-in',
  completedTiers: [],
  tierCompletedAt: {},
};

/**
 * Top-level questProgress node in Firebase.
 * questProgress => { uuid => QuestProgress }
 */
export type QuestProgressByOccupant = IndexedById<QuestProgress>;

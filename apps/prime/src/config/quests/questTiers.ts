/**
 * questTiers.ts
 *
 * Static configuration for quest tiers. Only progress is persisted to Firebase;
 * tier definitions, badges, and XP values are derived from this config.
 *
 * Badges and XP are computed from completedTiers using helper functions,
 * maintaining a single source of truth for progress.
 */

/**
 * Quest tier definition.
 */
export interface QuestTier {
  /** Unique identifier for the tier */
  id: string;
  /** i18n key for tier name: Quests.tiers.{id}.name */
  nameKey: string;
  /** i18n key for tier description: Quests.tiers.{id}.description */
  descriptionKey: string;
  /** Task IDs from completedTasks required to complete this tier */
  requiredTasks: string[];
  /** Unlock conditions for this tier */
  unlockCondition?: {
    /** Must complete this tier first */
    previousTier?: string;
    /** Hours after check-in before this tier unlocks */
    hoursAfterCheckIn?: number;
  };
  /** Badge earned on completion */
  badge: string;
  /** XP value earned on completion */
  xpValue: number;
}

/**
 * Default quest tier configuration.
 *
 * Tier order:
 * 1. settle-in - Basic orientation tasks (first day)
 * 2. social-night - Evening social activities
 * 3. positano-explorer - Local exploration (unlocks after 24h)
 */
export const QUEST_TIERS: QuestTier[] = [
  {
    id: 'settle-in',
    nameKey: 'Quests.tiers.settle-in.name',
    descriptionKey: 'Quests.tiers.settle-in.description',
    requiredTasks: ['welcome', 'featuresIntro', 'mainDoorAccess'],
    badge: 'early-bird',
    xpValue: 50,
  },
  {
    id: 'social-night',
    nameKey: 'Quests.tiers.social-night.name',
    descriptionKey: 'Quests.tiers.social-night.description',
    requiredTasks: ['complimentaryEveningDrink', 'activityJoined'],
    unlockCondition: { previousTier: 'settle-in' },
    badge: 'social-butterfly',
    xpValue: 100,
  },
  {
    id: 'positano-explorer',
    nameKey: 'Quests.tiers.positano-explorer.name',
    descriptionKey: 'Quests.tiers.positano-explorer.description',
    requiredTasks: ['guidebookVisited', 'localSpotVisited'],
    unlockCondition: { previousTier: 'settle-in', hoursAfterCheckIn: 24 },
    badge: 'explorer',
    xpValue: 150,
  },
];

/**
 * Get the ordered list of tier IDs.
 */
export function getTierOrder(): string[] {
  return QUEST_TIERS.map((tier) => tier.id);
}

/**
 * Get a tier by ID.
 */
export function getTierById(tierId: string): QuestTier | undefined {
  return QUEST_TIERS.find((tier) => tier.id === tierId);
}

/**
 * Derive badges from completed tiers.
 *
 * @param completedTiers - Array of completed tier IDs
 * @returns Array of badge IDs earned
 */
export function getBadgesFromTiers(completedTiers: string[]): string[] {
  return QUEST_TIERS.filter((tier) => completedTiers.includes(tier.id)).map(
    (tier) => tier.badge,
  );
}

/**
 * Derive total XP from completed tiers.
 *
 * @param completedTiers - Array of completed tier IDs
 * @returns Total XP earned
 */
export function getXpFromTiers(completedTiers: string[]): number {
  return QUEST_TIERS.filter((tier) => completedTiers.includes(tier.id)).reduce(
    (sum, tier) => sum + tier.xpValue,
    0,
  );
}

/**
 * Get the next tier ID after the given tier.
 *
 * @param currentTierId - The current tier ID
 * @returns The next tier ID, or null if at the last tier
 */
export function getNextTierId(currentTierId: string): string | null {
  const tierOrder = getTierOrder();
  const currentIndex = tierOrder.indexOf(currentTierId);

  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null;
  }

  return tierOrder[currentIndex + 1];
}

/**
 * Check if a tier is unlocked based on conditions.
 *
 * @param tier - The tier to check
 * @param completedTiers - Array of completed tier IDs
 * @param hoursElapsed - Hours since check-in
 * @returns true if the tier is unlocked
 */
export function isTierUnlocked(
  tier: QuestTier,
  completedTiers: string[],
  hoursElapsed: number,
): boolean {
  const { unlockCondition } = tier;

  // No unlock condition means always unlocked
  if (!unlockCondition) {
    return true;
  }

  // Check previous tier requirement
  if (
    unlockCondition.previousTier &&
    !completedTiers.includes(unlockCondition.previousTier)
  ) {
    return false;
  }

  // Check time-based requirement
  if (
    unlockCondition.hoursAfterCheckIn &&
    hoursElapsed < unlockCondition.hoursAfterCheckIn
  ) {
    return false;
  }

  return true;
}

/**
 * Get all available (unlocked but not completed) tiers.
 *
 * @param completedTiers - Array of completed tier IDs
 * @param hoursElapsed - Hours since check-in
 * @returns Array of available tier IDs
 */
export function getAvailableTiers(
  completedTiers: string[],
  hoursElapsed: number,
): string[] {
  return QUEST_TIERS.filter(
    (tier) =>
      !completedTiers.includes(tier.id) &&
      isTierUnlocked(tier, completedTiers, hoursElapsed),
  ).map((tier) => tier.id);
}

/**
 * Badge metadata for display.
 */
export interface BadgeInfo {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
}

/**
 * Badge definitions for display purposes.
 */
export const BADGES: BadgeInfo[] = [
  {
    id: 'early-bird',
    nameKey: 'Quests.badges.early-bird.name',
    descriptionKey: 'Quests.badges.early-bird.description',
    icon: 'sunrise',
  },
  {
    id: 'social-butterfly',
    nameKey: 'Quests.badges.social-butterfly.name',
    descriptionKey: 'Quests.badges.social-butterfly.description',
    icon: 'users',
  },
  {
    id: 'explorer',
    nameKey: 'Quests.badges.explorer.name',
    descriptionKey: 'Quests.badges.explorer.description',
    icon: 'compass',
  },
];

/**
 * Get badge info by ID.
 */
export function getBadgeById(badgeId: string): BadgeInfo | undefined {
  return BADGES.find((badge) => badge.id === badgeId);
}

import "@testing-library/jest-dom";
import {
  computeQuestState,
  isTierReadyForCompletion,
  getTiersReadyForCompletion,
  type QuestStateInput,
} from '../computeQuestState';
import type { OccupantCompletedTasks } from '../../../types/completedTasks';
import type { QuestProgress } from '../../../types/questProgress';
import type { GuestProfile } from '../../../types/guestProfile';

// Helper to create a base input
function createInput(
  overrides: Partial<QuestStateInput> = {},
): QuestStateInput {
  return {
    completedTasks: null,
    guestProfile: null,
    questProgress: null,
    currentTime: Date.now(),
    ...overrides,
  };
}

// Helper to create completed tasks
function createCompletedTasks(
  tasks: Record<string, boolean>,
): OccupantCompletedTasks {
  const result: OccupantCompletedTasks = {};
  for (const [key, value] of Object.entries(tasks)) {
    result[key] = value ? 'true' : 'false';
  }
  return result;
}

// Helper to create quest progress
function createQuestProgress(
  overrides: Partial<QuestProgress> = {},
): QuestProgress {
  return {
    bookingId: 'booking-123',
    checkInDate: '2026-01-13',
    currentTier: 'settle-in',
    completedTiers: [],
    tierCompletedAt: {},
    ...overrides,
  };
}

describe('computeQuestState', () => {
  describe('with no data', () => {
    it('returns safe defaults when all inputs are null', () => {
      const result = computeQuestState(createInput());

      expect(result.currentTier).toBe('settle-in');
      expect(result.completedTiers).toEqual([]);
      expect(result.totalXp).toBe(0);
      expect(result.badges).toEqual([]);
      expect(result.allComplete).toBe(false);
    });

    it('shows settle-in tier as active with 0% progress', () => {
      const result = computeQuestState(createInput());

      expect(result.activeTier).toBe('settle-in');
      expect(result.tierProgress['settle-in'].percentage).toBe(0);
      expect(result.tierProgress['settle-in'].isUnlocked).toBe(true);
      expect(result.tierProgress['settle-in'].isCompleted).toBe(false);
    });

    it('shows social-night tier as locked (requires settle-in)', () => {
      const result = computeQuestState(createInput());

      expect(result.tierProgress['social-night'].isUnlocked).toBe(false);
      expect(result.tierProgress['social-night'].requiredPreviousTier).toBe(
        'settle-in',
      );
    });
  });

  describe('tier progress calculation', () => {
    it('calculates correct percentage for partial completion', () => {
      const result = computeQuestState(
        createInput({
          completedTasks: createCompletedTasks({
            welcome: true,
            featuresIntro: true,
            mainDoorAccess: false,
          }),
        }),
      );

      // settle-in requires: welcome, featuresIntro, mainDoorAccess (3 tasks)
      // 2/3 complete = 67%
      expect(result.tierProgress['settle-in'].completedCount).toBe(2);
      expect(result.tierProgress['settle-in'].totalCount).toBe(3);
      expect(result.tierProgress['settle-in'].percentage).toBe(67);
    });

    it('shows 100% when all tasks complete', () => {
      const result = computeQuestState(
        createInput({
          completedTasks: createCompletedTasks({
            welcome: true,
            featuresIntro: true,
            mainDoorAccess: true,
          }),
        }),
      );

      expect(result.tierProgress['settle-in'].percentage).toBe(100);
    });

    it('tracks individual task completion status', () => {
      const result = computeQuestState(
        createInput({
          completedTasks: createCompletedTasks({
            welcome: true,
            featuresIntro: false,
            mainDoorAccess: true,
          }),
        }),
      );

      const tasks = result.tierProgress['settle-in'].tasks;
      expect(tasks.find((t) => t.taskId === 'welcome')?.isComplete).toBe(true);
      expect(tasks.find((t) => t.taskId === 'featuresIntro')?.isComplete).toBe(
        false,
      );
      expect(tasks.find((t) => t.taskId === 'mainDoorAccess')?.isComplete).toBe(
        true,
      );
    });
  });

  describe('tier unlock conditions', () => {
    it('unlocks social-night after settle-in is completed', () => {
      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in'],
          }),
        }),
      );

      expect(result.tierProgress['social-night'].isUnlocked).toBe(true);
      expect(result.availableTiers).toContain('social-night');
    });

    it('keeps positano-explorer locked until 24 hours after check-in', () => {
      // Check-in was today, only 12 hours elapsed
      const checkInDate = new Date();
      checkInDate.setHours(checkInDate.getHours() - 12);

      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in'],
            checkInDate: checkInDate.toISOString().split('T')[0],
          }),
          currentTime: Date.now(),
        }),
      );

      expect(result.tierProgress['positano-explorer'].isUnlocked).toBe(false);
      expect(result.tierProgress['positano-explorer'].hoursUntilUnlock).toBe(
        12,
      );
    });

    it('unlocks positano-explorer after 24 hours and settle-in complete', () => {
      // Check-in was 48 hours ago
      const checkInDate = new Date();
      checkInDate.setHours(checkInDate.getHours() - 48);

      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in'],
            checkInDate: checkInDate.toISOString().split('T')[0],
          }),
          currentTime: Date.now(),
        }),
      );

      expect(result.tierProgress['positano-explorer'].isUnlocked).toBe(true);
    });
  });

  describe('XP and badge computation', () => {
    it('returns 0 XP with no completed tiers', () => {
      const result = computeQuestState(createInput());
      expect(result.totalXp).toBe(0);
      expect(result.badges).toEqual([]);
    });

    it('awards 50 XP and early-bird badge for settle-in', () => {
      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in'],
          }),
        }),
      );

      expect(result.totalXp).toBe(50);
      expect(result.badges).toContain('early-bird');
    });

    it('awards cumulative XP for multiple tiers', () => {
      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in', 'social-night'],
          }),
        }),
      );

      // 50 + 100 = 150
      expect(result.totalXp).toBe(150);
      expect(result.badges).toEqual(['early-bird', 'social-butterfly']);
    });

    it('awards 300 XP for all tiers', () => {
      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in', 'social-night', 'positano-explorer'],
          }),
        }),
      );

      // 50 + 100 + 150 = 300
      expect(result.totalXp).toBe(300);
      expect(result.badges).toHaveLength(3);
      expect(result.allComplete).toBe(true);
    });
  });

  describe('next action computation', () => {
    it('suggests first incomplete task in available tier', () => {
      const result = computeQuestState(
        createInput({
          completedTasks: createCompletedTasks({
            welcome: true,
            featuresIntro: false,
          }),
        }),
      );

      expect(result.nextAction.type).toBe('complete-task');
      expect(result.nextAction.tierId).toBe('settle-in');
      expect(result.nextAction.taskId).toBe('featuresIntro');
    });

    it('suggests wait-for-unlock when tier is time-locked', () => {
      // Just completed settle-in, 12 hours elapsed
      const checkInDate = new Date();
      checkInDate.setHours(checkInDate.getHours() - 12);

      const result = computeQuestState(
        createInput({
          completedTasks: createCompletedTasks({
            // social-night tasks also complete
            complimentaryEveningDrink: true,
            activityJoined: true,
          }),
          questProgress: createQuestProgress({
            completedTiers: ['settle-in', 'social-night'],
            checkInDate: checkInDate.toISOString().split('T')[0],
          }),
          currentTime: Date.now(),
        }),
      );

      expect(result.nextAction.type).toBe('wait-for-unlock');
      expect(result.nextAction.tierId).toBe('positano-explorer');
      expect(result.nextAction.hoursRemaining).toBe(12);
    });

    it('returns all-complete when every tier is done', () => {
      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            completedTiers: ['settle-in', 'social-night', 'positano-explorer'],
          }),
        }),
      );

      expect(result.nextAction.type).toBe('all-complete');
      expect(result.allComplete).toBe(true);
    });
  });

  describe('hours elapsed calculation', () => {
    it('returns 0 when no check-in date', () => {
      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            checkInDate: '',
          }),
        }),
      );

      expect(result.hoursElapsed).toBe(0);
    });

    it('calculates hours from check-in date', () => {
      // Check-in was 48 hours ago
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() - 2);

      const result = computeQuestState(
        createInput({
          questProgress: createQuestProgress({
            checkInDate: checkInDate.toISOString().split('T')[0],
          }),
          currentTime: Date.now(),
        }),
      );

      // Should be approximately 48 hours (may vary due to time zone handling)
      expect(result.hoursElapsed).toBeGreaterThan(40);
      expect(result.hoursElapsed).toBeLessThan(60);
    });
  });
});

describe('isTierReadyForCompletion', () => {
  it('returns false when no tasks are complete', () => {
    expect(isTierReadyForCompletion('settle-in', null)).toBe(false);
  });

  it('returns false when only some tasks are complete', () => {
    const tasks = createCompletedTasks({
      welcome: true,
      featuresIntro: true,
      mainDoorAccess: false,
    });
    expect(isTierReadyForCompletion('settle-in', tasks)).toBe(false);
  });

  it('returns true when all required tasks are complete', () => {
    const tasks = createCompletedTasks({
      welcome: true,
      featuresIntro: true,
      mainDoorAccess: true,
    });
    expect(isTierReadyForCompletion('settle-in', tasks)).toBe(true);
  });

  it('returns false for unknown tier', () => {
    expect(isTierReadyForCompletion('unknown-tier', null)).toBe(false);
  });
});

describe('getTiersReadyForCompletion', () => {
  it('returns empty array when no tiers are ready', () => {
    const result = getTiersReadyForCompletion(null, [], 0);
    expect(result).toEqual([]);
  });

  it('returns settle-in when its tasks are complete', () => {
    const tasks = createCompletedTasks({
      welcome: true,
      featuresIntro: true,
      mainDoorAccess: true,
    });
    const result = getTiersReadyForCompletion(tasks, [], 0);
    expect(result).toContain('settle-in');
  });

  it('excludes already completed tiers', () => {
    const tasks = createCompletedTasks({
      welcome: true,
      featuresIntro: true,
      mainDoorAccess: true,
    });
    const result = getTiersReadyForCompletion(tasks, ['settle-in'], 0);
    expect(result).not.toContain('settle-in');
  });

  it('excludes locked tiers even if tasks complete', () => {
    const tasks = createCompletedTasks({
      complimentaryEveningDrink: true,
      activityJoined: true,
    });
    // social-night requires settle-in to be complete
    const result = getTiersReadyForCompletion(tasks, [], 0);
    expect(result).not.toContain('social-night');
  });

  it('includes unlocked tier when tasks complete', () => {
    const tasks = createCompletedTasks({
      complimentaryEveningDrink: true,
      activityJoined: true,
    });
    // settle-in is complete, so social-night is unlocked
    const result = getTiersReadyForCompletion(tasks, ['settle-in'], 0);
    expect(result).toContain('social-night');
  });
});

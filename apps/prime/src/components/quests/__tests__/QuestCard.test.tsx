import { render, screen } from '@testing-library/react';

import type { QuestState } from '../../../lib/quests/computeQuestState';
import QuestCard from '../QuestCard';

// Mock quest state values
let mockQuestState: QuestState | null = null;
let mockIsLoading = false;

jest.mock('../../../hooks/useComputedQuestState', () => ({
  useComputedQuestState: () => ({
    questState: mockQuestState,
    isLoading: mockIsLoading,
    error: null,
    completeTier: jest.fn(),
    pendingCompletions: [],
    processPendingCompletions: jest.fn(),
  }),
}));

jest.mock('../../../config/quests/questTiers', () => ({
  getTierById: (id: string) => {
    const tiers: Record<string, any> = {
      'settle-in': {
        id: 'settle-in',
        nameKey: 'Quests.tiers.settle-in.name',
        requiredTasks: ['welcome', 'featuresIntro', 'mainDoorAccess'],
        badge: 'early-bird',
        xpValue: 50,
      },
      'social-night': {
        id: 'social-night',
        nameKey: 'Quests.tiers.social-night.name',
        requiredTasks: ['complimentaryEveningDrink', 'activityJoined'],
        badge: 'social-butterfly',
        xpValue: 100,
      },
    };
    return tiers[id] ?? null;
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      if (opts?.hours) return `${key} (${opts.hours}h)`;
      return key;
    },
  }),
}));

describe('QuestCard', () => {
  beforeEach(() => {
    mockQuestState = null;
    mockIsLoading = false;
  });

  it('renders nothing while loading', () => {
    mockIsLoading = true;
    const { container } = render(<QuestCard />);

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when questState is null', () => {
    mockQuestState = null;
    const { container } = render(<QuestCard />);

    expect(container.innerHTML).toBe('');
  });

  it('renders in-progress quest with progress bar', () => {
    mockQuestState = {
      activeTier: 'settle-in',
      allComplete: false,
      completedTiers: [],
      badges: [],
      totalXp: 0,
      hoursElapsed: 2,
      tierProgress: {
        'settle-in': {
          completedCount: 1,
          totalCount: 3,
          percentage: 33,
          tasks: [
            { taskId: 'welcome', isComplete: true },
            { taskId: 'featuresIntro', isComplete: false },
            { taskId: 'mainDoorAccess', isComplete: false },
          ],
        },
      },
      nextAction: { type: 'complete-task', taskId: 'featuresIntro' },
    };

    render(<QuestCard />);

    // Shows current quest label
    expect(screen.getByText('labels.currentQuest')).toBeDefined();
    // Shows tier name
    expect(screen.getByText('Quests.tiers.settle-in.name')).toBeDefined();
    // Shows progress counts
    expect(screen.getByText(/1\/3/)).toBeDefined();
    expect(screen.getByText('33%')).toBeDefined();
    // Shows XP
    expect(screen.getByText('0 XP')).toBeDefined();
    // Shows next action
    expect(screen.getByText('featuresIntro')).toBeDefined();
  });

  it('renders all-complete state with badges and XP', () => {
    mockQuestState = {
      activeTier: null,
      allComplete: true,
      completedTiers: ['settle-in', 'social-night'],
      badges: ['early-bird', 'social-butterfly'],
      totalXp: 150,
      hoursElapsed: 48,
      tierProgress: {},
      nextAction: { type: 'all-done' },
    };

    render(<QuestCard />);

    expect(screen.getByText('labels.allComplete')).toBeDefined();
    expect(screen.getByText('150 XP')).toBeDefined();
  });

  it('renders wait-for-unlock state with time remaining', () => {
    mockQuestState = {
      activeTier: 'settle-in',
      allComplete: false,
      completedTiers: [],
      badges: [],
      totalXp: 0,
      hoursElapsed: 2,
      tierProgress: {
        'settle-in': {
          completedCount: 3,
          totalCount: 3,
          percentage: 100,
          tasks: [
            { taskId: 'welcome', isComplete: true },
            { taskId: 'featuresIntro', isComplete: true },
            { taskId: 'mainDoorAccess', isComplete: true },
          ],
        },
      },
      nextAction: { type: 'wait-for-unlock', hoursRemaining: 22 },
    };

    render(<QuestCard />);

    expect(screen.getByText('labels.lockedUntil (22h)')).toBeDefined();
  });

  it('shows earned badges when present', () => {
    mockQuestState = {
      activeTier: 'social-night',
      allComplete: false,
      completedTiers: ['settle-in'],
      badges: ['early-bird'],
      totalXp: 50,
      hoursElapsed: 26,
      tierProgress: {
        'social-night': {
          completedCount: 0,
          totalCount: 2,
          percentage: 0,
          tasks: [
            { taskId: 'complimentaryEveningDrink', isComplete: false },
            { taskId: 'activityJoined', isComplete: false },
          ],
        },
      },
      nextAction: { type: 'complete-task', taskId: 'complimentaryEveningDrink' },
    };

    render(<QuestCard />);

    expect(screen.getByText(/labels\.badges/)).toBeDefined();
    expect(screen.getByText('50 XP')).toBeDefined();
  });

  it('applies className prop', () => {
    mockQuestState = {
      activeTier: null,
      allComplete: true,
      completedTiers: ['settle-in'],
      badges: ['early-bird'],
      totalXp: 50,
      hoursElapsed: 48,
      tierProgress: {},
      nextAction: { type: 'all-done' },
    };

    const { container } = render(<QuestCard className="mt-4" />);

    expect(container.firstElementChild?.className).toContain('mt-4');
  });
});

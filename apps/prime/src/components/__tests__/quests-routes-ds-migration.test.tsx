/**
 * DS Migration Tests — Quests + Routes Components (TASK-09)
 *
 * Verifies that the 6 complex component files have no raw Tailwind
 * palette classes after migration to semantic DS theme tokens.
 */

import { render } from '@testing-library/react';

// ── RAW PALETTE PATTERNS ────────────────────────────────────────────
const RAW_PALETTE = /(^|\s)(bg|text|border|ring|shadow|divide|placeholder|stroke|fill|from|to|via)-(gray|slate|blue|green|emerald|red|amber|yellow|orange|purple|indigo|teal|sky|cyan|violet|rose|lime|fuchsia|pink|white)-\d+/;
const RAW_WHITE = /(^|\s)(bg|text|border)-white(?:\s|"|$)/;
const ARBITRARY_HEX = /(bg|text|border)-\[#[0-9a-fA-F]+\]/;

function assertNoRawPaletteClasses(html: string, _componentName: string) {
  const match = html.match(RAW_PALETTE);
  expect(match).toBeNull();
}

function assertNoRawWhite(html: string, _componentName: string) {
  const match = html.match(RAW_WHITE);
  expect(match).toBeNull();
}

function assertNoArbitraryColors(html: string, _componentName: string) {
  const match = html.match(ARBITRARY_HEX);
  expect(match).toBeNull();
}

// ── SHARED MOCKS ────────────────────────────────────────────────────

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>) =>
      typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () =>
  new Proxy({}, {
    get: (_, name) => {
      if (name === '__esModule') return true;
      return function MockIcon(props: any) {
        return <span data-testid={`icon-${String(name)}`} {...props} />;
      };
    },
  }),
);

// ── QUEST MOCKS ─────────────────────────────────────────────────────

jest.mock('../../config/quests/questTiers', () => ({
  BADGES: [
    { id: 'explorer', nameKey: 'badges.explorer.name' },
    { id: 'socialite', nameKey: 'badges.socialite.name' },
    { id: 'adventurer', nameKey: 'badges.adventurer.name' },
  ],
  QUEST_TIERS: [
    { id: 'tier-1', badge: 'explorer', nameKey: 'tiers.explorer', xpValue: 100 },
    { id: 'tier-2', badge: 'socialite', nameKey: 'tiers.socialite', xpValue: 200 },
    { id: 'tier-3', badge: 'adventurer', nameKey: 'tiers.adventurer', xpValue: 300 },
  ],
  getTierById: jest.fn((id: string) => ({
    id,
    badge: 'explorer',
    nameKey: 'tiers.explorer',
    xpValue: 100,
  })),
  getBadgeById: jest.fn((id: string) => ({
    id,
    nameKey: 'badges.explorer.name',
    descriptionKey: 'badges.explorer.desc',
  })),
}));

jest.mock('../../hooks/useComputedQuestState', () => ({
  useComputedQuestState: jest.fn(() => ({
    questState: {
      badges: ['explorer'],
      totalXp: 150,
      completedTiers: ['tier-1'],
      allComplete: false,
      activeTier: 'tier-2',
      tierProgress: {
        'tier-2': { completedCount: 2, totalCount: 5, percentage: 40 },
      },
      nextAction: { type: 'complete-task', taskId: 'visit-beach' },
    },
    isLoading: false,
  })),
}));

jest.mock('../quests/BadgeIcon', () => {
  return function MockBadgeIcon({ badgeId: _badgeId, size: _size, ...props }: any) {
    return <span data-testid="badge-icon" {...props} />;
  };
});

// ── ROUTE MOCKS ─────────────────────────────────────────────────────

jest.mock('../../hooks/useRoutes', () => ({
  useRoutes: jest.fn(() => ({
    origins: [
      { id: 'airport', name: 'Airport', icon: 'plane', category: 'air' },
    ],
    routes: [
      {
        slug: 'bus-route-1',
        title: 'Airport Bus',
        description: 'Direct bus from airport',
        origin: 'Airport',
        destination: 'Hostel',
        primaryMode: 'bus' as const,
        modes: ['bus'] as const[],
        totalDurationMinutes: 45,
        segments: [{ from: 'Airport', to: 'Hostel', mode: 'bus', durationMinutes: 45 }],
        costRange: { min: 5, max: 5 },
        recommended: true,
      },
    ],
    originsByCategory: {
      air: [{ id: 'airport', name: 'Airport', icon: 'plane', category: 'air' }],
    },
    getRoute: jest.fn(),
  })),
}));

// ── TESTS ───────────────────────────────────────────────────────────

describe('TASK-09: Quests + Routes components — DS migration', () => {
  it('RouteDetail.tsx has no raw palette classes', () => {
    const { RouteDetail } =
      jest.requireActual('../routes/RouteDetail');
    const { container } = render(
      <RouteDetail
        route={{
          slug: 'test-route',
          title: 'Test Route',
          description: 'A test route',
          origin: 'Airport',
          destination: 'Hostel',
          primaryMode: 'bus',
          modes: ['bus', 'ferry', 'train'],
          totalDurationMinutes: 120,
          segments: [
            { from: 'Airport', to: 'Port', mode: 'bus', durationMinutes: 30, operator: 'City Bus' },
            { from: 'Port', to: 'Hostel', mode: 'ferry', durationMinutes: 90, notes: 'Scenic route' },
          ],
          costRange: { min: 10, max: 15 },
          warnings: ['Check schedule for holidays'],
          briketteUrl: 'https://example.com/route',
        }}
        isSaved={false}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'RouteDetail');
    assertNoRawWhite(html, 'RouteDetail');
    assertNoArbitraryColors(html, 'RouteDetail');
  });

  it('RouteCard.tsx has no raw palette classes', () => {
    const { RouteCard } =
      jest.requireActual('../routes/RouteCard');
    const { container } = render(
      <RouteCard
        route={{
          slug: 'test-route',
          title: 'Test Route',
          description: 'A test',
          origin: 'Airport',
          destination: 'Hostel',
          primaryMode: 'bus',
          modes: ['bus', 'train', 'walk'],
          totalDurationMinutes: 60,
          segments: [
            { from: 'Airport', to: 'Station', mode: 'bus', durationMinutes: 30 },
            { from: 'Station', to: 'Hostel', mode: 'walk', durationMinutes: 30 },
          ],
          costRange: { min: 3, max: 7 },
          recommended: true,
          warnings: ['Construction on route'],
        }}
        onClick={jest.fn()}
        isSaved={true}
      />,
    );
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'RouteCard');
    assertNoRawWhite(html, 'RouteCard');
    assertNoArbitraryColors(html, 'RouteCard');
  });

  it('RoutePlanner.tsx has no raw palette classes', () => {
    const { RoutePlanner } =
      jest.requireActual('../routes/RoutePlanner');
    const { container } = render(
      <RoutePlanner
        savedRouteSlug={null}
        onSaveRoute={jest.fn()}
        onRouteViewed={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'RoutePlanner');
    assertNoRawWhite(html, 'RoutePlanner');
    assertNoArbitraryColors(html, 'RoutePlanner');
  });

  it('QuestCard.tsx has no raw palette classes', () => {
    const QuestCard =
      jest.requireActual('../quests/QuestCard').default;
    const { container } = render(<QuestCard />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'QuestCard');
    assertNoRawWhite(html, 'QuestCard');
    assertNoArbitraryColors(html, 'QuestCard');
  });

  it('BadgeCollection.tsx has no raw palette classes', () => {
    const BadgeCollection =
      jest.requireActual('../quests/BadgeCollection').default;
    const { container } = render(<BadgeCollection mode="full" />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'BadgeCollection');
    assertNoRawWhite(html, 'BadgeCollection');
    assertNoArbitraryColors(html, 'BadgeCollection');
  });

  it('TierCompletionModal.tsx has no raw palette classes', () => {
    // Suppress styled-jsx warnings (Next.js compiler not available in Jest)
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0]);
      if (msg.includes('non-boolean attribute') && String(args).includes('jsx')) return;
      if (msg.includes('does not recognize') && String(args).includes('jsx')) return;
      origError(...(args as []));
    };
    try {
      const TierCompletionModal =
        jest.requireActual('../quests/TierCompletionModal').default;
      const { container } = render(
        <TierCompletionModal tierId="tier-1" onClose={jest.fn()} />,
      );
      const html = container.innerHTML;

      assertNoRawPaletteClasses(html, 'TierCompletionModal');
      assertNoRawWhite(html, 'TierCompletionModal');
      assertNoArbitraryColors(html, 'TierCompletionModal');
    } finally {
      console.error = origError;
    }
  });

  it('TierCompletionModal CSS animations are preserved', () => {
    // Suppress styled-jsx warnings (Next.js compiler not available in Jest)
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0]);
      if (msg.includes('non-boolean attribute') && String(args).includes('jsx')) return;
      if (msg.includes('does not recognize') && String(args).includes('jsx')) return;
      origError(...(args as []));
    };
    try {
      const TierCompletionModal =
        jest.requireActual('../quests/TierCompletionModal').default;
      const { container } = render(
        <TierCompletionModal tierId="tier-1" onClose={jest.fn()} />,
      );
      const html = container.innerHTML;

      // CSS animation classes must remain in the rendered output
      expect(html).toContain('animate-bounce-in');
      expect(html).toContain('animate-pulse-slow');
      // Confetti keyframes in style tag
      expect(html).toContain('confetti-fall');
    } finally {
      console.error = origError;
    }
  });
});

import { render, screen } from '@testing-library/react';

import SocialHighlightsCard from '../SocialHighlightsCard';

// Mock activities store
let mockActivities: Record<string, any> = {};

jest.mock('../../../contexts/messaging/ChatProvider', () => ({
  useChat: () => ({ activities: mockActivities }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('SocialHighlightsCard', () => {
  beforeEach(() => {
    mockActivities = {};
  });

  describe('empty activity state (guidebook fallback)', () => {
    it('shows guidebook CTA when no activities exist', () => {
      render(<SocialHighlightsCard />);

      expect(screen.getByText('social.explorePositano')).toBeDefined();
      expect(screen.getByText('social.discoverTitle')).toBeDefined();
      expect(screen.getByText('social.discoverDescription')).toBeDefined();
      expect(screen.getByText('social.exploreGuide')).toBeDefined();
    });

    it('links to /positano-guide in empty state', () => {
      render(<SocialHighlightsCard />);

      const link = screen.getByText('social.exploreGuide').closest('a');
      expect(link?.getAttribute('href')).toBe('/positano-guide');
    });

    it('shows guidebook CTA when all activities are in the past', () => {
      mockActivities = {
        act1: { id: 'act1', title: 'Past Event', startTime: Date.now() - 86400000 },
      };

      render(<SocialHighlightsCard />);

      expect(screen.getByText('social.explorePositano')).toBeDefined();
      expect(screen.queryByText('Past Event')).toBeNull();
    });
  });

  describe('with upcoming activities', () => {
    const futureTime = Date.now() + 86400000; // tomorrow

    beforeEach(() => {
      mockActivities = {
        act1: { id: 'act1', title: 'Sunset Drinks', startTime: futureTime },
        act2: { id: 'act2', title: 'Group Hike', startTime: futureTime + 7200000 },
      };
    });

    it('shows the next upcoming activity', () => {
      render(<SocialHighlightsCard />);

      expect(screen.getByText('social.upcomingActivity')).toBeDefined();
      expect(screen.getByText('Sunset Drinks')).toBeDefined();
    });

    it('shows join chat and see all CTAs', () => {
      render(<SocialHighlightsCard />);

      expect(screen.getByText('social.joinChat')).toBeDefined();
      expect(screen.getByText('social.seeAll')).toBeDefined();
    });

    it('links to chat channel for the activity', () => {
      render(<SocialHighlightsCard />);

      const chatLink = screen.getByText('social.joinChat').closest('a');
      expect(chatLink?.getAttribute('href')).toBe('/chat/channel?id=act1');
    });

    it('links to /activities for see all', () => {
      render(<SocialHighlightsCard />);

      const seeAllLink = screen.getByText('social.seeAll').closest('a');
      expect(seeAllLink?.getAttribute('href')).toBe('/activities');
    });

    it('limits displayed activities to 2', () => {
      mockActivities = {
        act1: { id: 'act1', title: 'Event 1', startTime: futureTime },
        act2: { id: 'act2', title: 'Event 2', startTime: futureTime + 1000 },
        act3: { id: 'act3', title: 'Event 3', startTime: futureTime + 2000 },
      };

      render(<SocialHighlightsCard />);

      // Only the first (next) activity title is shown in the main card
      expect(screen.getByText('Event 1')).toBeDefined();
    });
  });

  describe('intent-based CTA adaptation', () => {
    const futureTime = Date.now() + 86400000;

    beforeEach(() => {
      mockActivities = {
        act1: { id: 'act1', title: 'Sunset Drinks', startTime: futureTime },
      };
    });

    it('uses enthusiastic CTAs for social intent', () => {
      render(<SocialHighlightsCard intent="social" />);

      expect(screen.getByText('social.joinChat')).toBeDefined();
      expect(screen.getByText('social.seeAll')).toBeDefined();
    });

    it('uses softer CTAs for quiet intent', () => {
      render(<SocialHighlightsCard intent="quiet" />);

      expect(screen.getByText('social.seeWhatsHappening')).toBeDefined();
      expect(screen.getByText('social.browse')).toBeDefined();
    });

    it('uses default CTAs for mixed intent', () => {
      render(<SocialHighlightsCard intent="mixed" />);

      expect(screen.getByText('social.joinChat')).toBeDefined();
      expect(screen.getByText('social.seeAll')).toBeDefined();
    });

    it('defaults to mixed when no intent provided', () => {
      render(<SocialHighlightsCard />);

      expect(screen.getByText('social.joinChat')).toBeDefined();
    });
  });

  it('applies className prop', () => {
    const { container } = render(<SocialHighlightsCard className="my-custom-class" />);

    expect(container.firstElementChild?.className).toContain('my-custom-class');
  });
});

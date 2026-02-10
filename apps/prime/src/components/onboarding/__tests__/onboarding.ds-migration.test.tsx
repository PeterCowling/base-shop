/**
 * DS Migration tests for onboarding components (TASK-07)
 * Verifies all raw Tailwind palette classes have been replaced with semantic DS tokens.
 */

import { render } from '@testing-library/react';

import GuestProfileStep from '../GuestProfileStep';
import OnboardingLayout from '../OnboardingLayout';
import ProgressBar from '../ProgressBar';
import SocialOptInStep from '../SocialOptInStep';
import WelcomeHandoffStep from '../WelcomeHandoffStep';

// --- Shared mocks ---

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts?.name) return `${key} ${opts.name}`;
      return key;
    },
  }),
}));

jest.mock('@acme/design-system/primitives', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../OnboardingLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../hooks/mutator/useGuestProfileMutator', () => ({
  useGuestProfileMutator: () => ({
    setProfile: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../../hooks/mutator/useCompletedTaskMutator', () => ({
  useCompletedTaskMutator: () => ({ completeTask: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock('../../../hooks/dataOrchestrator/useGuestProgressData', () => ({
  useGuestProgressData: () => ({
    guestProfile: null,
    effectiveQuestProgress: null,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../contexts/messaging/ChatProvider', () => ({
  useChat: () => ({ activities: {} }),
}));

const RAW_PALETTE = {
  blue: /\b(bg|text|border)-blue-\d+/,
  gray: /\b(bg|text|border)-gray-\d+/,
  green: /\b(bg|text|border)-green-\d+/,
  amber: /\b(bg|text|border)-amber-\d+/,
};

function assertNoRawPalette(html: string) {
  for (const [, pattern] of Object.entries(RAW_PALETTE)) {
    expect(html).not.toMatch(pattern);
  }
}

function assertNoArbitraryColors(html: string) {
  // Match hex arbitrary values like bg-[#f9f9f9] or text-[#333]
  expect(html).not.toMatch(/\b(bg|text|border)-\[#[0-9a-fA-F]+\]/);
}

describe('Onboarding DS Migration', () => {
  beforeEach(() => jest.clearAllMocks());

  // Unmock OnboardingLayout for its own test
  describe('OnboardingLayout', () => {
    beforeEach(() => {
      // Re-require the real module for this test
      jest.unmock('../OnboardingLayout');
    });

    afterEach(() => {
      jest.mock('../OnboardingLayout', () => ({
        __esModule: true,
        default: ({ children }: any) => <div>{children}</div>,
      }));
    });

    it('should use semantic tokens, not raw palette or arbitrary colors', () => {
      // Import real OnboardingLayout
      const RealLayout = jest.requireActual('../OnboardingLayout').default;
      const { container } = render(
        <RealLayout currentStep={1} totalSteps={3} title="Test">
          <div>content</div>
        </RealLayout>,
      );
      const html = container.innerHTML;
      assertNoRawPalette(html);
      assertNoArbitraryColors(html);
    });
  });

  describe('ProgressBar', () => {
    it('should use semantic tokens, not raw palette classes', () => {
      const RealProgressBar = jest.requireActual('../ProgressBar').default;
      const { container } = render(<RealProgressBar currentStep={2} totalSteps={5} />);
      assertNoRawPalette(container.innerHTML);
    });
  });

  describe('GuestProfileStep', () => {
    it('should use semantic tokens, not raw palette classes', () => {
      const { container } = render(
        <GuestProfileStep onContinue={jest.fn()} bookingId="b_1" />,
      );
      assertNoRawPalette(container.innerHTML);
    });
  });

  describe('SocialOptInStep', () => {
    it('should use semantic tokens, not raw palette classes', () => {
      const { container } = render(
        <SocialOptInStep onContinue={jest.fn()} bookingId="b_1" />,
      );
      assertNoRawPalette(container.innerHTML);
    });
  });

  describe('WelcomeHandoffStep', () => {
    it('should use semantic tokens, not raw palette classes', () => {
      const { container } = render(
        <WelcomeHandoffStep onContinue={jest.fn()} bookingId="b_1" guestName="Test" />,
      );
      assertNoRawPalette(container.innerHTML);
    });
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GuestProfileStep from '../GuestProfileStep';

// Mock hooks
const mockSetProfile = jest.fn().mockResolvedValue(undefined);
const mockCompleteTask = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/dataOrchestrator/useGuestProgressData', () => ({
  useGuestProgressData: () => ({
    guestProfile: null,
    effectiveQuestProgress: null,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../hooks/mutator/useGuestProfileMutator', () => ({
  useGuestProfileMutator: () => ({ setProfile: mockSetProfile }),
}));

jest.mock('../../../hooks/mutator/useCompletedTaskMutator', () => ({
  useCompletedTaskMutator: () => ({ completeTask: mockCompleteTask }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@acme/design-system/primitives', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../OnboardingLayout', () => ({
  __esModule: true,
  default: ({ children, title }: any) => (
    <div data-testid="onboarding-layout">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

describe('GuestProfileStep', () => {
  const onContinue = jest.fn();
  const defaultProps = { onContinue, bookingId: 'booking_123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders intent, interests, goals, and pace sections', () => {
    render(<GuestProfileStep {...defaultProps} />);

    expect(screen.getByText('guestProfile.intentLabel')).toBeDefined();
    expect(screen.getByText('guestProfile.interestsLabel')).toBeDefined();
    expect(screen.getByText('guestProfile.goalsLabel')).toBeDefined();
    expect(screen.getByText('guestProfile.paceLabel')).toBeDefined();
  });

  it('renders save and skip buttons', () => {
    render(<GuestProfileStep {...defaultProps} />);

    expect(screen.getByText('guestProfile.saveCta')).toBeDefined();
    expect(screen.getByText('guestProfile.skipCta')).toBeDefined();
  });

  it('saves profile with complete status on save', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'booking_123',
          profileStatus: 'complete',
          intent: 'mixed', // default
          interests: [],
          stayGoals: [],
          pace: 'relaxed', // default
        }),
      );
    });

    expect(mockCompleteTask).toHaveBeenCalledWith('profileOnboardingComplete', true);
    expect(onContinue).toHaveBeenCalled();
  });

  it('saves profile with skipped status on skip', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    fireEvent.click(screen.getByText('guestProfile.skipCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'booking_123',
          profileStatus: 'skipped',
        }),
      );
    });

    expect(mockCompleteTask).toHaveBeenCalledWith('profileOnboardingComplete', true);
    expect(onContinue).toHaveBeenCalled();
  });

  it('calls onContinue even when setProfile fails', async () => {
    mockSetProfile.mockRejectedValueOnce(new Error('network error'));

    render(<GuestProfileStep {...defaultProps} />);

    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });

  it('allows selecting an intent', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    // Click the social intent button
    fireEvent.click(screen.getByText('guestProfile.intent.social'));
    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'social' }),
      );
    });
  });

  it('allows toggling interests', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    fireEvent.click(screen.getByText('guestProfile.interests.hiking'));
    fireEvent.click(screen.getByText('guestProfile.interests.food'));
    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({ interests: ['hiking', 'food'] }),
      );
    });
  });

  it('allows deselecting an interest', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    // Select then deselect hiking
    fireEvent.click(screen.getByText('guestProfile.interests.hiking'));
    fireEvent.click(screen.getByText('guestProfile.interests.hiking'));
    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({ interests: [] }),
      );
    });
  });

  it('sets socialOptIn based on intent (quiet = false)', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    fireEvent.click(screen.getByText('guestProfile.intent.quiet'));
    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({ socialOptIn: false }),
      );
    });
  });

  it('sets socialOptIn based on intent (social = true)', async () => {
    render(<GuestProfileStep {...defaultProps} />);

    fireEvent.click(screen.getByText('guestProfile.intent.social'));
    fireEvent.click(screen.getByText('guestProfile.saveCta'));

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({ socialOptIn: true }),
      );
    });
  });
});

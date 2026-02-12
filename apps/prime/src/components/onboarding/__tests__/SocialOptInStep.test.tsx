import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SocialOptInStep from '../SocialOptInStep';

// Mock hooks
const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
const mockActivities: Record<string, any> = {};

jest.mock('../../../contexts/messaging/ChatProvider', () => ({
  useChat: () => ({ activities: mockActivities }),
}));

jest.mock('../../../hooks/mutator/useGuestProfileMutator', () => ({
  useGuestProfileMutator: () => ({ updateProfile: mockUpdateProfile }),
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

describe('SocialOptInStep', () => {
  const onContinue = jest.fn();
  const defaultProps = { onContinue, bookingId: 'booking_123' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset activities to empty
    Object.keys(mockActivities).forEach((k) => delete mockActivities[k]);
  });

  it('renders opt-in cards for activities and chat', () => {
    render(<SocialOptInStep {...defaultProps} />);

    expect(screen.getByText('socialOptIn.activities.title')).toBeDefined();
    expect(screen.getByText('socialOptIn.chat.title')).toBeDefined();
  });

  it('renders save and skip buttons', () => {
    render(<SocialOptInStep {...defaultProps} />);

    expect(screen.getByText('socialOptIn.saveCta')).toBeDefined();
    expect(screen.getByText('socialOptIn.skipCta')).toBeDefined();
  });

  it('shows guidebook CTA when no upcoming activities', () => {
    render(<SocialOptInStep {...defaultProps} />);

    expect(screen.getByText('socialOptIn.noActivities.title')).toBeDefined();
    expect(screen.getByText('socialOptIn.noActivities.description')).toBeDefined();
  });

  it('shows upcoming activities when they exist', () => {
    const futureTime = Date.now() + 86400000; // tomorrow
    Object.assign(mockActivities, {
      act1: { id: 'act1', title: 'Sunset Drinks', startTime: futureTime },
      act2: { id: 'act2', title: 'Group Dinner', startTime: futureTime + 3600000 },
    });

    render(<SocialOptInStep {...defaultProps} />);

    expect(screen.getByText('Sunset Drinks')).toBeDefined();
    expect(screen.getByText('Group Dinner')).toBeDefined();
    expect(screen.getByText('socialOptIn.upcomingActivities')).toBeDefined();
  });

  it('does not show past activities', () => {
    const pastTime = Date.now() - 86400000; // yesterday
    Object.assign(mockActivities, {
      act1: { id: 'act1', title: 'Old Event', startTime: pastTime },
    });

    render(<SocialOptInStep {...defaultProps} />);

    expect(screen.queryByText('Old Event')).toBeNull();
    // Should show the no-activities fallback
    expect(screen.getByText('socialOptIn.noActivities.title')).toBeDefined();
  });

  it('saves socialOptIn and chatOptIn on save', async () => {
    render(<SocialOptInStep {...defaultProps} />);

    fireEvent.click(screen.getByText('socialOptIn.saveCta'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        socialOptIn: true, // default state
        chatOptIn: false, // default state
      });
    });

    expect(onContinue).toHaveBeenCalled();
  });

  it('saves both as false on skip', async () => {
    render(<SocialOptInStep {...defaultProps} />);

    fireEvent.click(screen.getByText('socialOptIn.skipCta'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        socialOptIn: false,
        chatOptIn: false,
      });
    });

    expect(onContinue).toHaveBeenCalled();
  });

  it('calls onContinue even when updateProfile fails', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('network error'));

    render(<SocialOptInStep {...defaultProps} />);

    fireEvent.click(screen.getByText('socialOptIn.saveCta'));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });

  it('limits displayed activities to 3', () => {
    const futureTime = Date.now() + 86400000;
    Object.assign(mockActivities, {
      act1: { id: 'act1', title: 'Activity 1', startTime: futureTime },
      act2: { id: 'act2', title: 'Activity 2', startTime: futureTime + 1000 },
      act3: { id: 'act3', title: 'Activity 3', startTime: futureTime + 2000 },
      act4: { id: 'act4', title: 'Activity 4', startTime: futureTime + 3000 },
    });

    render(<SocialOptInStep {...defaultProps} />);

    expect(screen.getByText('Activity 1')).toBeDefined();
    expect(screen.getByText('Activity 2')).toBeDefined();
    expect(screen.getByText('Activity 3')).toBeDefined();
    expect(screen.queryByText('Activity 4')).toBeNull();
  });
});

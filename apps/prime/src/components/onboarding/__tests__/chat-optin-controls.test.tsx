/**
 * chat-optin-controls.test.tsx
 *
 * Tests for guest-to-guest opt-in messaging controls.
 * Validates TC-01 through TC-04 from TASK-46.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { GuestProfile } from '../../../types/guestProfile';
// Import component after mocks
import ChatOptInControls from '../../settings/ChatOptInControls';

// Mock profile mutator
const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
const mockSetProfile = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/mutator/useGuestProfileMutator', () => ({
  useGuestProfileMutator: () => ({
    updateProfile: mockUpdateProfile,
    setProfile: mockSetProfile,
    isLoading: false,
    isError: false,
    isSuccess: false,
  }),
}));

jest.mock('../../../hooks/useUuid', () => ({
  __esModule: true,
  default: () => 'test-uuid-123',
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

describe('ChatOptInControls', () => {
  const mockProfile: GuestProfile = {
    bookingId: 'booking_123',
    profileStatus: 'complete',
    intent: 'social',
    interests: [],
    stayGoals: [],
    pace: 'active',
    socialOptIn: true,
    chatOptIn: true,
    blockedUsers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-01: Opt-in toggle controls', () => {
    it('displays current chatOptIn state', () => {
      render(<ChatOptInControls profile={mockProfile} />);

      // Should show toggle for chatOptIn
      const toggle = screen.getByRole('checkbox', { name: /chat.optIn.label/i });
      expect(toggle).toBeChecked();
    });

    it('allows toggling chatOptIn on', async () => {
      const offProfile = { ...mockProfile, chatOptIn: false };
      render(<ChatOptInControls profile={offProfile} />);

      const toggle = screen.getByRole('checkbox', { name: /chat.optIn.label/i });
      expect(toggle).not.toBeChecked();

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ chatOptIn: true });
      });
    });

    it('allows toggling chatOptIn off', async () => {
      render(<ChatOptInControls profile={mockProfile} />);

      const toggle = screen.getByRole('checkbox', { name: /chat.optIn.label/i });
      expect(toggle).toBeChecked();

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ chatOptIn: false });
      });
    });

    it('shows privacy-safe description', () => {
      render(<ChatOptInControls profile={mockProfile} />);

      // Should explain what chatOptIn does
      expect(screen.getByText(/chat.optIn.description/i)).toBeDefined();
    });
  });

  describe('TC-02: Privacy defaults', () => {
    it('renders correctly when chatOptIn is false (default)', () => {
      const defaultProfile = { ...mockProfile, chatOptIn: false };
      render(<ChatOptInControls profile={defaultProfile} />);

      const toggle = screen.getByRole('checkbox', { name: /chat.optIn.label/i });
      expect(toggle).not.toBeChecked();
    });

    it('shows explanation when opted out', () => {
      const defaultProfile = { ...mockProfile, chatOptIn: false };
      render(<ChatOptInControls profile={defaultProfile} />);

      // Should show what happens when opted out
      expect(screen.getByText(/chat.optIn.description/i)).toBeDefined();
    });
  });

  describe('TC-03: Error handling', () => {
    it('continues to show UI when update fails', async () => {
      mockUpdateProfile.mockRejectedValueOnce(new Error('network error'));

      render(<ChatOptInControls profile={mockProfile} />);

      const toggle = screen.getByRole('checkbox', { name: /chat.optIn.label/i });
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });

      // UI should still be visible
      expect(screen.getByRole('checkbox', { name: /chat.optIn.label/i })).toBeDefined();
    });
  });
});

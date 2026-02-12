import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  buildGuestHomeUrl,
  readGuestSession,
  validateGuestToken,
} from '../../../lib/auth/guestSessionGuard';
import GuestPortalPage from '../page';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../../../lib/auth/guestSessionGuard', () => ({
  readGuestSession: jest.fn(),
  clearGuestSession: jest.fn(),
  validateGuestToken: jest.fn(),
  buildGuestHomeUrl: jest.fn(),
}));

jest.mock('../../../components/portal/GuidedOnboardingFlow', () => ({
  __esModule: true,
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div>
      <div>guided-onboarding-visible</div>
      <button type="button" onClick={onComplete}>
        complete-onboarding
      </button>
    </div>
  ),
}));

describe('Portal guided onboarding integration', () => {
  const mockedReadGuestSession = readGuestSession as jest.MockedFunction<typeof readGuestSession>;
  const mockedValidateGuestToken = validateGuestToken as jest.MockedFunction<typeof validateGuestToken>;
  const mockedBuildGuestHomeUrl = buildGuestHomeUrl as jest.MockedFunction<typeof buildGuestHomeUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedReadGuestSession.mockReturnValue({
      token: 'valid-token',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    mockedValidateGuestToken.mockResolvedValue('valid');
    mockedBuildGuestHomeUrl.mockReturnValue('/?uuid=occ_1234567890123');
  });

  it('TC-01: verified guest enters guided onboarding flow instead of static portal placeholder', async () => {
    render(<GuestPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('guided-onboarding-visible')).toBeDefined();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('TC-04: completion redirects into guarded home and marks onboarding complete', async () => {
    render(<GuestPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('guided-onboarding-visible')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'complete-onboarding' }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?uuid=occ_1234567890123');
    });

    expect(localStorage.getItem('prime_guided_onboarding_complete:BOOK123')).toBe('1');
  });
});

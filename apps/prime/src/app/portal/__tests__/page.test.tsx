import { render, screen, waitFor } from '@testing-library/react';
import GuestPortalPage from '../page';
import {
  buildGuestHomeUrl,
  clearGuestSession,
  readGuestSession,
  validateGuestToken,
} from '../../../lib/auth/guestSessionGuard';

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

describe('GuestPortalPage', () => {
  const mockedReadGuestSession = readGuestSession as jest.MockedFunction<typeof readGuestSession>;
  const mockedClearGuestSession = clearGuestSession as jest.MockedFunction<typeof clearGuestSession>;
  const mockedValidateGuestToken = validateGuestToken as jest.MockedFunction<typeof validateGuestToken>;
  const mockedBuildGuestHomeUrl = buildGuestHomeUrl as jest.MockedFunction<typeof buildGuestHomeUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedBuildGuestHomeUrl.mockReturnValue('/?uuid=occ_1234567890123');
  });

  it('TC-01: valid token redirects to guarded home', async () => {
    mockedReadGuestSession.mockReturnValue({
      token: 'valid-token',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    mockedValidateGuestToken.mockResolvedValue('valid');

    render(<GuestPortalPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?uuid=occ_1234567890123');
    });
  });

  it('TC-02: expired token clears session and redirects to find-my-stay', async () => {
    mockedReadGuestSession.mockReturnValue({
      token: 'expired-token',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    mockedValidateGuestToken.mockResolvedValue('expired');

    render(<GuestPortalPage />);

    await waitFor(() => {
      expect(mockedClearGuestSession).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/find-my-stay');
    });
  });

  it('TC-03: missing token shows portal unavailable message', async () => {
    mockedReadGuestSession.mockReturnValue({
      token: null,
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });

    render(<GuestPortalPage />);

    expect(screen.getByText('Portal unavailable')).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import GuardedLayout from '../layout';
import { usePinAuth } from '../../../contexts/messaging/PinAuthProvider';
import {
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

jest.mock('../../../contexts/messaging/PinAuthProvider', () => ({
  PinAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePinAuth: jest.fn(),
}));

jest.mock('../../../contexts/messaging/ChatProvider', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../hooks/useSessionValidation', () => ({
  useSessionValidation: jest.fn(),
}));

jest.mock('../../../lib/auth/guestSessionGuard', () => ({
  readGuestSession: jest.fn(),
  clearGuestSession: jest.fn(),
  validateGuestToken: jest.fn(),
}));

describe('GuardedLayout', () => {
  const mockedUsePinAuth = usePinAuth as jest.MockedFunction<typeof usePinAuth>;
  const mockedReadGuestSession = readGuestSession as jest.MockedFunction<typeof readGuestSession>;
  const mockedClearGuestSession = clearGuestSession as jest.MockedFunction<typeof clearGuestSession>;
  const mockedValidateGuestToken = validateGuestToken as jest.MockedFunction<typeof validateGuestToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePinAuth.mockReturnValue({
      user: null,
      role: null,
      isAuthenticated: false,
      login: async () => false,
      logout: jest.fn(),
    });
    mockedReadGuestSession.mockReturnValue({
      token: null,
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });
  });

  it('TC-01: valid guest token renders guarded content', async () => {
    mockedReadGuestSession.mockReturnValue({
      token: 'valid-token',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    mockedValidateGuestToken.mockResolvedValue('valid');

    render(
      <GuardedLayout>
        <div>guarded-child</div>
      </GuardedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('guarded-child')).toBeDefined();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('TC-02: expired token clears storage and redirects to find-my-stay', async () => {
    mockedReadGuestSession.mockReturnValue({
      token: 'expired-token',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    mockedValidateGuestToken.mockResolvedValue('expired');

    render(
      <GuardedLayout>
        <div>guarded-child</div>
      </GuardedLayout>,
    );

    await waitFor(() => {
      expect(mockedClearGuestSession).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/find-my-stay');
    });
  });

  it('TC-03: no guest session and no staff auth redirects to public root', async () => {
    render(
      <GuardedLayout>
        <div>guarded-child</div>
      </GuardedLayout>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('TC-04: validation network failure is fail-open for guest session', async () => {
    mockedReadGuestSession.mockReturnValue({
      token: 'network-token',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    mockedValidateGuestToken.mockResolvedValue('network_error');

    render(
      <GuardedLayout>
        <div>guarded-child</div>
      </GuardedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('guarded-child')).toBeDefined();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

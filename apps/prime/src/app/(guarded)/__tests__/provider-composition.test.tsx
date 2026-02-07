import { render, screen, waitFor } from '@testing-library/react';
import GuardedLayout from '../layout';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../../../hooks/useSessionValidation', () => ({
  useSessionValidation: jest.fn(),
}));

jest.mock('../../../lib/auth/guestSessionGuard', () => ({
  readGuestSession: jest.fn(() => ({
    token: 'valid-token',
    bookingId: 'BOOK123',
    uuid: 'occ_1234567890123',
    firstName: 'Jane',
    verifiedAt: '2026-02-07T00:00:00.000Z',
  })),
  clearGuestSession: jest.fn(),
  validateGuestToken: jest.fn(async () => 'valid'),
}));

jest.mock('../../../contexts/messaging/PinAuthProvider', () => ({
  PinAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="pin-auth-provider">{children}</div>
  ),
  usePinAuth: () => ({
    user: null,
    role: null,
    isAuthenticated: false,
    login: async () => false,
    logout: jest.fn(),
  }),
}));

jest.mock('../../../contexts/messaging/ChatProvider', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="chat-provider">{children}</div>
  ),
}));

describe('GuardedLayout provider composition', () => {
  it('wraps guarded content with PinAuthProvider and ChatProvider', async () => {
    render(
      <GuardedLayout>
        <div>guarded-child</div>
      </GuardedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('pin-auth-provider')).toBeDefined();
      expect(screen.getByTestId('chat-provider')).toBeDefined();
      expect(screen.getByText('guarded-child')).toBeDefined();
    });
    expect(mockReplace).not.toHaveBeenCalledWith('/');
  });
});

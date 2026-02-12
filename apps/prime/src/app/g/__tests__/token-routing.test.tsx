/**
 * TASK-42: Deep-link routing verification for guest token paths
 * Tests the /g page component's handling of various token scenarios
 */

import { render, screen, waitFor } from '@testing-library/react';

import GuestEntryPage from '../page';

// Mock next/navigation at module level
let mockSearchParamsGet: (key: string) => string | null = () => null;

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsGet(key),
  }),
}));

describe('Guest token routing', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet = () => null;
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TC-01: Preview smoke validates /g/<token> redirect handoff to /g?token=...', () => {
    it('accepts token from query parameter after redirect', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'redirected-token-123' : null);

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Confirm your stay')).toBeDefined();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('token=redirected-token-123'),
      );
    });

    it('accepts shorthand token parameter "t" for SMS link economy', async () => {
      mockSearchParamsGet = (key: string) => (key === 't' ? 'sms-short-token' : null);

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Confirm your stay')).toBeDefined();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('token=sms-short-token'),
      );
    });

    it('prefers full "token" parameter over shorthand "t"', async () => {
      mockSearchParamsGet = (key: string) => {
        if (key === 'token') return 'full-token';
        if (key === 't') return 'short-token';
        return null;
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Confirm your stay')).toBeDefined();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('token=full-token'),
      );
    });
  });

  describe('TC-02: Hard refresh on guarded route keeps user in valid state', () => {
    it('validates token on mount and shows verification form when token is valid', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'valid-refresh-token' : null);

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Confirm your stay')).toBeDefined();
      });

      expect(screen.getByLabelText('Last name')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
    });

    it('shows loading state during token validation', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'loading-token' : null);

      let resolveValidation: () => void;
      const validationPromise = new Promise<Response>((resolve) => {
        resolveValidation = () => {
          resolve({
            ok: true,
            status: 200,
            json: async () => ({}),
          } as Response);
        };
      });

      fetchMock.mockReturnValue(validationPromise);

      render(<GuestEntryPage />);

      // Should show loading spinner immediately
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();

      resolveValidation!();

      await waitFor(() => {
        expect(screen.getByText('Confirm your stay')).toBeDefined();
      });
    });
  });

  describe('TC-03: Invalid token path renders explicit recovery CTA', () => {
    it('shows recovery link for missing token', async () => {
      mockSearchParamsGet = () => null;

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Link problem')).toBeDefined();
      });

      expect(screen.getByText('Missing or invalid link.')).toBeDefined();
      expect(screen.getByText('Find my stay')).toBeDefined();
    });

    it('shows recovery link for 404 token validation', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'not-found-token' : null);

      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Link problem')).toBeDefined();
      });

      expect(screen.getByText('This link is no longer valid.')).toBeDefined();

      const recoveryLink = screen.getByText('Find my stay').closest('a');
      expect(recoveryLink?.getAttribute('href')).toBe('/find-my-stay');
    });

    it('shows recovery link for 410 expired token', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'expired-token' : null);

      fetchMock.mockResolvedValue({
        ok: false,
        status: 410,
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Link problem')).toBeDefined();
      });

      expect(screen.getByText('This link has expired.')).toBeDefined();

      const recoveryLink = screen.getByText('Find my stay').closest('a');
      expect(recoveryLink?.getAttribute('href')).toBe('/find-my-stay');
    });

    it('shows recovery link for generic validation errors', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'error-token' : null);

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Link problem')).toBeDefined();
      });

      expect(screen.getByText('Unable to validate this link.')).toBeDefined();

      const recoveryLink = screen.getByText('Find my stay').closest('a');
      expect(recoveryLink?.getAttribute('href')).toBe('/find-my-stay');
    });

    it('shows recovery link for network errors', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'network-error-token' : null);

      fetchMock.mockRejectedValue(new Error('Network failure'));

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Link problem')).toBeDefined();
      });

      expect(screen.getByText('Network failure')).toBeDefined();

      const recoveryLink = screen.getByText('Find my stay').closest('a');
      expect(recoveryLink?.getAttribute('href')).toBe('/find-my-stay');
    });
  });

  describe('Edge cases and deterministic recovery', () => {
    it('handles empty string token as missing token', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? '' : null);

      render(<GuestEntryPage />);

      await waitFor(() => {
        expect(screen.getByText('Link problem')).toBeDefined();
      });

      expect(screen.getByText('Missing or invalid link.')).toBeDefined();
    });

    it('cleans up fetch on component unmount during validation', async () => {
      mockSearchParamsGet = (key: string) => (key === 'token' ? 'unmount-test-token' : null);

      const neverResolve = new Promise<Response>(() => {
        // Never resolves
      });

      fetchMock.mockReturnValue(neverResolve);

      const { unmount } = render(<GuestEntryPage />);

      // Wait for component to start validation
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      // Unmount while validation is in flight
      unmount();

      // If cleanup works correctly, no state updates should occur after unmount
      // (no way to test this directly, but component shouldn't throw)
    });
  });
});

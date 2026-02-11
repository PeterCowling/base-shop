import { act, renderHook } from '@testing-library/react';

import { bootstrapStaffAuthSession } from '../../../services/staffAuthBootstrap';
import { PinAuthProvider, usePinAuth } from '../PinAuthProvider';

jest.mock('../../../services/staffAuthBootstrap', () => ({
  bootstrapStaffAuthSession: jest.fn(),
}));

const mockedBootstrapStaffAuthSession = jest.mocked(bootstrapStaffAuthSession);

describe('PinAuthProvider replacement', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('returns safe defaults without provider', async () => {
    const { result } = renderHook(() => usePinAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.authToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    await expect(result.current.login('1234')).resolves.toBe(false);
  });

  it('TC-01: valid staff PIN bootstrap returns authenticated staff session with role claims', async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          customToken: 'custom-token-123',
          uid: 'staff_user_1',
          role: 'staff',
          claims: {
            role: 'staff',
          },
        }),
        { status: 200 },
      )) as unknown as typeof fetch;

    mockedBootstrapStaffAuthSession.mockResolvedValue({
      ok: true,
      userId: 'staff_user_1',
      idToken: 'firebase-id-token-abc',
      role: 'staff',
      claims: {
        role: 'staff',
        hostelId: 'prime',
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PinAuthProvider>{children}</PinAuthProvider>
    );
    const { result } = renderHook(() => usePinAuth(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.login('2468');
    });

    expect(success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'staff_user_1' });
    expect(result.current.role).toBe('staff');
    expect(result.current.claims).toEqual({
      role: 'staff',
      hostelId: 'prime',
    });
    expect(result.current.authToken).toBe('firebase-id-token-abc');
    expect(result.current.authError).toBeNull();
    expect(result.current.lockout).toBeNull();
    expect(mockedBootstrapStaffAuthSession).toHaveBeenCalledWith('custom-token-123');
    expect(window.localStorage.getItem('prime_staff_auth_token')).toBe('firebase-id-token-abc');
  });

  it('TC-02: invalid PIN attempt returns deterministic failure and lockout counters', async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          error: 'Invalid PIN',
          failedAttempts: 2,
          attemptsRemaining: 3,
          lockedUntil: null,
        }),
        { status: 401 },
      )) as unknown as typeof fetch;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PinAuthProvider>{children}</PinAuthProvider>
    );
    const { result } = renderHook(() => usePinAuth(), { wrapper });

    let success = true;
    await act(async () => {
      success = await result.current.login('0000');
    });

    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.authError).toBe('Invalid PIN');
    expect(result.current.lockout).toEqual({
      failedAttempts: 2,
      attemptsRemaining: 3,
      lockedUntil: null,
    });
    expect(mockedBootstrapStaffAuthSession).not.toHaveBeenCalled();
  });
});

import { renderHook } from '@testing-library/react';

import { validateGuestToken } from '../../lib/auth/guestSessionGuard';
import { useSessionValidation } from '../useSessionValidation';

jest.mock('../../lib/auth/guestSessionGuard', () => ({
  validateGuestToken: jest.fn(),
}));

describe('useSessionValidation', () => {
  const mockedValidateGuestToken = validateGuestToken as jest.MockedFunction<typeof validateGuestToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('TC-01: valid token keeps session active without callbacks', async () => {
    mockedValidateGuestToken.mockResolvedValue('valid');
    const onInvalidOrExpired = jest.fn();

    renderHook(() =>
      useSessionValidation({
        token: 'token-123',
        enabled: true,
        intervalMs: 1000,
        onInvalidOrExpired,
      }),
    );

    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(mockedValidateGuestToken).toHaveBeenCalled();
    expect(onInvalidOrExpired).not.toHaveBeenCalled();
  });

  it('TC-02: expired token triggers invalid/expired callback', async () => {
    mockedValidateGuestToken.mockResolvedValue('expired');
    const onInvalidOrExpired = jest.fn();

    renderHook(() =>
      useSessionValidation({
        token: 'token-123',
        enabled: true,
        intervalMs: 1000,
        onInvalidOrExpired,
      }),
    );

    await Promise.resolve();

    expect(onInvalidOrExpired).toHaveBeenCalledTimes(1);
  });

  it('TC-03: network errors fail-open and do not clear session', async () => {
    mockedValidateGuestToken.mockResolvedValue('network_error');
    const onInvalidOrExpired = jest.fn();

    renderHook(() =>
      useSessionValidation({
        token: 'token-123',
        enabled: true,
        intervalMs: 1000,
        onInvalidOrExpired,
      }),
    );

    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(onInvalidOrExpired).not.toHaveBeenCalled();
  });
});

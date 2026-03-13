/**
 * useUuid unit tests
 *
 * Covers TC-04-01 through TC-04-05:
 *   TC-04-01: context uuid returned when AuthSessionContext.guestUuid is set
 *   TC-04-02: localStorage fallback when context is null
 *   TC-04-03: null-both → empty string returned (router.replace('/error') called)
 *   TC-04-04: URL uuid differs from context uuid → mismatch event emitted; context uuid wins
 *   TC-04-05: no URL param → no mismatch event; context uuid returned normally
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { AuthSessionContext } from '../../contexts/auth/AuthSessionContext';
import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';
import useUuid from '../useUuid';

// Mock next/navigation
const mockRouterReplace = jest.fn();
let mockSearchParamsGet: jest.Mock = jest.fn().mockReturnValue(null);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

// Mock @acme/lib/logger/client
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
jest.mock('@acme/lib/logger/client', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}));

// Mock activationFunnel
jest.mock('../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

// Mock zodErrorToString
jest.mock('@/utils/zodErrorToString', () => ({
  zodErrorToString: () => 'invalid format',
}));

const mockedRecordActivationFunnelEvent = recordActivationFunnelEvent as jest.MockedFunction<typeof recordActivationFunnelEvent>;

function wrapWithContext(guestUuid: string | null) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AuthSessionContext.Provider,
      { value: { guestUuid } },
      children,
    );
  };
}

describe('useUuid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet = jest.fn().mockReturnValue(null);
    localStorage.clear();
  });

  it('TC-04-01: returns context uuid when AuthSessionContext.guestUuid is set', async () => {
    const { result } = renderHook(() => useUuid(), {
      wrapper: wrapWithContext('occ_1234567890123'),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe('occ_1234567890123');
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('TC-04-02: falls back to localStorage when context is null', async () => {
    localStorage.setItem('prime_guest_uuid', 'occ_9876543210987');

    const { result } = renderHook(() => useUuid(), {
      wrapper: wrapWithContext(null),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe('occ_9876543210987');
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('TC-04-03: redirects to /error when both context and localStorage are null', async () => {
    const { result } = renderHook(() => useUuid(), {
      wrapper: wrapWithContext(null),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe('');
    expect(mockRouterReplace).toHaveBeenCalledWith('/error');
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('TC-04-04: emits mismatch event when URL uuid differs from context uuid; returns context uuid', async () => {
    mockSearchParamsGet = jest.fn().mockReturnValue('occ_9999999999999');

    const { result } = renderHook(() => useUuid(), {
      wrapper: wrapWithContext('occ_1234567890123'),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe('occ_1234567890123');
    expect(mockLoggerWarn).toHaveBeenCalled();
    expect(mockedRecordActivationFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'utility_action_used',
        context: expect.objectContaining({
          utilityAction: 'security_uuid_mismatch',
        }),
      }),
    );
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('TC-04-05: no mismatch event when URL param is absent; context uuid returned normally', async () => {
    // mockSearchParamsGet already returns null (from beforeEach)

    const { result } = renderHook(() => useUuid(), {
      wrapper: wrapWithContext('occ_1234567890123'),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe('occ_1234567890123');
    expect(mockedRecordActivationFunnelEvent).not.toHaveBeenCalled();
    expect(mockLoggerWarn).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

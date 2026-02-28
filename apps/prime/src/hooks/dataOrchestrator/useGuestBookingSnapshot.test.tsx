import '@testing-library/jest-dom';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { readGuestSession } from '@/lib/auth/guestSessionGuard';

import { useGuestBookingSnapshot } from './useGuestBookingSnapshot';

jest.mock('@/lib/auth/guestSessionGuard', () => ({
  readGuestSession: jest.fn(),
}));

const mockReadGuestSession = readGuestSession as jest.MockedFunction<typeof readGuestSession>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockSnapshot = {
  bookingId: 'booking-123',
  guestUuid: 'uuid-456',
  guestName: 'Alice',
  reservationCode: 'RES-ABC',
  checkInDate: '2025-09-01',
  checkOutDate: '2025-09-03',
  roomNumbers: ['5'],
  roomAssignment: '5',
  isCheckedIn: false,
  arrivalState: 'pre-arrival' as const,
  preorders: {},
  bagStorage: null,
  requestSummary: {},
};

describe('useGuestBookingSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null snapshot and isLoading=true while fetching', async () => {
    mockReadGuestSession.mockReturnValue({
      token: 'guest-token-abc',
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });

    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useGuestBookingSnapshot(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.snapshot).toBeNull();
  });

  it('returns snapshot data on successful fetch', async () => {
    mockReadGuestSession.mockReturnValue({
      token: 'guest-token-abc',
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSnapshot,
    });

    const { result } = renderHook(() => useGuestBookingSnapshot(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.snapshot).toEqual(mockSnapshot);
    expect(result.current.error).toBeNull();
    expect(result.current.token).toBe('guest-token-abc');
  });

  it('returns error on 500 response', async () => {
    mockReadGuestSession.mockReturnValue({
      token: 'guest-token-abc',
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useGuestBookingSnapshot(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('booking_snapshot_failed');
  });

  it('returns session_expired error on 410 response', async () => {
    mockReadGuestSession.mockReturnValue({
      token: 'guest-token-abc',
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 410,
    });

    const { result } = renderHook(() => useGuestBookingSnapshot(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect((result.current.error as Error).message).toBe('session_expired');
  });

  it('does not fire query when token is null', () => {
    mockReadGuestSession.mockReturnValue({
      token: null,
      bookingId: null,
      uuid: null,
      firstName: null,
      verifiedAt: null,
    });

    const { result } = renderHook(() => useGuestBookingSnapshot(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.snapshot).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

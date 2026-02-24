import { renderHook, waitFor } from '@testing-library/react';

import { useGuestProfiles } from '../useGuestProfiles';

type MockSnapshot = {
  exists: () => boolean;
  val: () => unknown;
};

function createMockSnapshot(value: unknown): MockSnapshot {
  return {
    exists: () => value !== null && value !== undefined,
    val: () => value,
  };
}

const mockReadGuestSession = jest.fn(() => ({
  bookingId: 'booking_123',
  firstName: 'Guest',
  token: 'token_123',
  uuid: 'guest_abc',
  verifiedAt: null,
}));

jest.mock('@/lib/auth/guestSessionGuard', () => ({
  readGuestSession: () => mockReadGuestSession(),
}));

const mockRef = jest.fn();
const mockQuery = jest.fn();
const mockOrderByChild = jest.fn();
const mockEqualTo = jest.fn();
const mockOnValue = jest.fn();
const mockOff = jest.fn();

jest.mock('@/services/firebase', () => ({
  equalTo: (...args: unknown[]) => mockEqualTo(...args),
  off: (...args: unknown[]) => mockOff(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  orderByChild: (...args: unknown[]) => mockOrderByChild(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  ref: (...args: unknown[]) => mockRef(...args),
}));

const sharedDatabase = { id: 'db' };
const mockUseFirebaseDatabase = jest.fn(() => sharedDatabase);

jest.mock('../../../services/useFirebase', () => ({
  useFirebaseDatabase: () => mockUseFirebaseDatabase(),
}));

describe('useGuestProfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockReadGuestSession.mockReturnValue({
      bookingId: 'booking_123',
      firstName: 'Guest',
      token: 'token_123',
      uuid: 'guest_abc',
      verifiedAt: null,
    });

    mockRef.mockImplementation((_db: unknown, path: string) => ({
      _path: path,
      toString: () => path,
    }));

    mockOrderByChild.mockImplementation((key: string) => ({
      _orderByChild: key,
    }));

    mockEqualTo.mockImplementation((value: string) => ({
      _equalTo: value,
    }));

    mockQuery.mockImplementation((...args: unknown[]) => ({
      _args: args,
      _path: 'guestProfiles:query',
      toString: () => 'guestProfiles:query',
    }));

    mockOnValue.mockImplementation(
      (
        _target: unknown,
        callback: (snapshot: MockSnapshot) => void,
        _errorCallback?: (error: Error) => void,
      ) => {
        callback(
          createMockSnapshot({
            guest_abc: {
              blockedUsers: [],
              bookingId: 'booking_123',
              chatOptIn: true,
              createdAt: 1,
              intent: 'mixed',
              updatedAt: 1,
            },
            guest_xyz: {
              blockedUsers: [],
              bookingId: 'booking_123',
              chatOptIn: true,
              createdAt: 1,
              intent: 'social',
              updatedAt: 1,
            },
          }),
        );

        return () => {};
      },
    );
  });

  it('queries guest profiles by current booking and returns snapshot data', async () => {
    const { result } = renderHook(() => useGuestProfiles());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockRef).toHaveBeenCalledWith(sharedDatabase, 'guestProfiles');
    expect(mockOrderByChild).toHaveBeenCalledWith('bookingId');
    expect(mockEqualTo).toHaveBeenCalledWith('booking_123');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockOnValue).toHaveBeenCalledTimes(1);
    expect(Object.keys(result.current.profiles)).toEqual(['guest_abc', 'guest_xyz']);
  });

  it('fails closed when bookingId is missing', async () => {
    mockReadGuestSession.mockReturnValue({
      bookingId: null,
      firstName: 'Guest',
      token: 'token_123',
      uuid: 'guest_abc',
      verifiedAt: null,
    });

    const { result } = renderHook(() => useGuestProfiles());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profiles).toEqual({});
    expect(result.current.error).toBeNull();
    expect(mockOnValue).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('cleans up firebase listener on unmount', async () => {
    const unsubscribe = jest.fn();
    mockOnValue.mockImplementation(
      (
        _target: unknown,
        callback: (snapshot: MockSnapshot) => void,
        _errorCallback?: (error: Error) => void,
      ) => {
        callback(createMockSnapshot({}));
        return unsubscribe;
      },
    );

    const { unmount } = renderHook(() => useGuestProfiles());

    await waitFor(() => {
      expect(mockOnValue).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(mockOff).toHaveBeenCalledWith(
      expect.objectContaining({
        _path: 'guestProfiles:query',
      }),
    );
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

/**
 * useFetchGuestProfile.test.ts
 *
 * TC-09: effectiveProfile ghostMode default
 *
 * The effectiveProfile object is assembled via an explicit per-field spread
 * (no ...data shortcut). This test verifies that ghostMode defaults to false
 * when the RTDB payload omits the ghostMode field, preventing silent undefined
 * from propagating to downstream consumers.
 */

import { renderHook, waitFor } from '@testing-library/react';

import useUuid from '../../useUuid';
import { useFetchGuestProfile } from '../useFetchGuestProfile';

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

const mockRef = jest.fn();
const mockGet = jest.fn();
const sharedDatabase = { id: 'db' };

jest.mock('@/services/firebase', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  get: (...args: unknown[]) => mockGet(...args),
}));

jest.mock('../../../services/useFirebase', () => ({
  useFirebaseDatabase: () => sharedDatabase,
}));

jest.mock('../../useUuid', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@acme/lib/logger/client', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const mockedUseUuid = useUuid as jest.MockedFunction<typeof useUuid>;

describe('useFetchGuestProfile — effectiveProfile ghostMode default (TC-09)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUuid.mockReturnValue('test-uuid');
    mockRef.mockReturnValue({ key: 'guestProfiles/test-uuid' });
  });

  it('TC-09: effectiveProfile.ghostMode defaults to false when RTDB payload omits ghostMode', async () => {
    // Simulate a profile from RTDB that does NOT have ghostMode (legacy node)
    const legacyRtdbPayload = {
      bookingId: 'BOOK123',
      profileStatus: 'complete' as const,
      intent: 'mixed' as const,
      interests: [],
      stayGoals: [],
      pace: 'relaxed' as const,
      socialOptIn: true,
      chatOptIn: true,
      // ghostMode deliberately omitted — simulates old RTDB node
      blockedUsers: [],
      createdAt: 1,
      updatedAt: 1,
    };

    mockGet.mockResolvedValue(createMockSnapshot(legacyRtdbPayload));

    const { result } = renderHook(() =>
      useFetchGuestProfile({ currentBookingId: 'BOOK123' }),
    );

    await waitFor(() => !result.current.isLoading);

    expect(result.current.effectiveProfile.ghostMode).toBe(false);
  });

  it('effectiveProfile.ghostMode is true when RTDB payload has ghostMode: true', async () => {
    const payload = {
      bookingId: 'BOOK123',
      profileStatus: 'complete' as const,
      intent: 'mixed' as const,
      interests: [],
      stayGoals: [],
      pace: 'relaxed' as const,
      socialOptIn: true,
      chatOptIn: true,
      ghostMode: true,
      blockedUsers: [],
      createdAt: 1,
      updatedAt: 1,
    };

    mockGet.mockResolvedValue(createMockSnapshot(payload));

    const { result } = renderHook(() =>
      useFetchGuestProfile({ currentBookingId: 'BOOK123' }),
    );

    await waitFor(() => !result.current.isLoading);

    expect(result.current.effectiveProfile.ghostMode).toBe(true);
  });

  it('effectiveProfile.ghostMode is false when no profile exists (fallback to DEFAULT_GUEST_PROFILE)', async () => {
    mockGet.mockResolvedValue(createMockSnapshot(null));

    const { result } = renderHook(() =>
      useFetchGuestProfile({ currentBookingId: 'BOOK123' }),
    );

    await waitFor(() => !result.current.isLoading);

    expect(result.current.effectiveProfile.ghostMode).toBe(false);
  });
});

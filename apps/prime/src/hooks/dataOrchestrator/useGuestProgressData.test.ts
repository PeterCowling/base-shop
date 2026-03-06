import '@testing-library/jest-dom';

import { renderHook, waitFor } from '@testing-library/react';

import {
  initializeQuestProgressFromCompletedTasks,
  isQuestProgressStale,
} from '../../lib/quests/initializeQuestProgress';
import { useQuestProgressMutator } from '../mutator/useQuestProgressMutator';
import { useFetchGuestProfile } from '../pureData/useFetchGuestProfile';
import { useFetchQuestProgress } from '../pureData/useFetchQuestProgress';

import { useGuestProgressData } from './useGuestProgressData';
import { useUnifiedBookingData } from './useUnifiedBookingData';

jest.mock('./useUnifiedBookingData', () => ({
  useUnifiedBookingData: jest.fn(),
}));
jest.mock('../pureData/useFetchGuestProfile', () => ({
  useFetchGuestProfile: jest.fn(),
}));
jest.mock('../pureData/useFetchQuestProgress', () => ({
  useFetchQuestProgress: jest.fn(),
}));
jest.mock('../mutator/useQuestProgressMutator', () => ({
  useQuestProgressMutator: jest.fn(),
}));
jest.mock('../../lib/quests/initializeQuestProgress', () => ({
  initializeQuestProgressFromCompletedTasks: jest.fn(),
  isQuestProgressStale: jest.fn(),
}));

const mockUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<typeof useUnifiedBookingData>;
const mockUseFetchGuestProfile = useFetchGuestProfile as jest.MockedFunction<typeof useFetchGuestProfile>;
const mockUseFetchQuestProgress = useFetchQuestProgress as jest.MockedFunction<typeof useFetchQuestProgress>;
const mockUseQuestProgressMutator = useQuestProgressMutator as jest.MockedFunction<typeof useQuestProgressMutator>;
const mockInitializeQuestProgressFromCompletedTasks =
  initializeQuestProgressFromCompletedTasks as jest.MockedFunction<typeof initializeQuestProgressFromCompletedTasks>;
const mockIsQuestProgressStale = isQuestProgressStale as jest.MockedFunction<typeof isQuestProgressStale>;

describe('useGuestProgressData', () => {
  const mockSetProgress = jest.fn(async () => {});

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        reservationCode: 'RES-001',
        checkInDate: '2026-03-10',
        completedTasks: { welcome: 'true' },
      } as any,
      isLoading: false,
      error: null,
    } as any);

    mockUseFetchGuestProfile.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isStale: false,
      effectiveProfile: {
        profileStatus: 'partial',
        intent: 'mixed',
        interests: [],
        stayGoals: [],
        pace: 'relaxed',
        socialOptIn: false,
        chatOptIn: false,
        blockedUsers: [],
      },
      refetch: jest.fn(async () => {}),
    });

    mockUseFetchQuestProgress.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isStale: false,
      effectiveProgress: {
        bookingId: 'RES-001',
        checkInDate: '2026-03-10',
        currentTier: 'settle-in',
        completedTiers: [],
        tierCompletedAt: {},
      },
      refetch: jest.fn(async () => {}),
    });

    mockUseQuestProgressMutator.mockReturnValue({
      updateProgress: jest.fn(async () => {}),
      setProgress: mockSetProgress,
      completeTier: jest.fn(async () => {}),
      initializeProgress: jest.fn(async () => {}),
      isLoading: false,
      isError: false,
      isSuccess: false,
    });

    mockInitializeQuestProgressFromCompletedTasks.mockReturnValue({
      bookingId: 'RES-001',
      checkInDate: '2026-03-10',
      currentTier: 'settle-in',
      completedTiers: [],
      tierCompletedAt: {},
    });

    mockIsQuestProgressStale.mockReturnValue(false);
  });

  it('returns partial profile defaults and shows banner when no profile exists', () => {
    const { result } = renderHook(() => useGuestProgressData());

    expect(result.current.currentBookingId).toBe('RES-001');
    expect(result.current.currentCheckInDate).toBe('2026-03-10');
    expect(result.current.effectiveProfileStatus).toBe('partial');
    expect(result.current.showProfileBanner).toBe(true);
  });

  it('hides profile banner when a fresh complete profile exists', () => {
    mockUseFetchGuestProfile.mockReturnValue({
      data: {
        bookingId: 'RES-001',
        profileStatus: 'complete',
        intent: 'mixed',
        interests: [],
        stayGoals: [],
        pace: 'relaxed',
        socialOptIn: false,
        chatOptIn: false,
        blockedUsers: [],
        createdAt: 1,
        updatedAt: 1,
      },
      error: null,
      isLoading: false,
      isError: false,
      isStale: false,
      effectiveProfile: {
        profileStatus: 'complete',
        intent: 'mixed',
        interests: [],
        stayGoals: [],
        pace: 'relaxed',
        socialOptIn: false,
        chatOptIn: false,
        blockedUsers: [],
      },
      refetch: jest.fn(async () => {}),
    });

    const { result } = renderHook(() => useGuestProgressData());

    expect(result.current.effectiveProfileStatus).toBe('complete');
    expect(result.current.showProfileBanner).toBe(false);
  });

  it('auto-initializes quest progress when current progress is stale', async () => {
    mockIsQuestProgressStale.mockReturnValue(true);

    const { result } = renderHook(() => useGuestProgressData());

    await waitFor(() => {
      expect(mockInitializeQuestProgressFromCompletedTasks).toHaveBeenCalledWith(
        'RES-001',
        '2026-03-10',
        { welcome: 'true' },
      );
      expect(mockSetProgress).toHaveBeenCalledTimes(1);
      expect(result.current.isQuestInitialized).toBe(true);
    });
  });

  it('does not initialize quest progress when stored progress is already fresh', async () => {
    mockUseFetchQuestProgress.mockReturnValue({
      data: {
        bookingId: 'RES-001',
        checkInDate: '2026-03-10',
        currentTier: 'settle-in',
        completedTiers: [],
        tierCompletedAt: {},
      },
      error: null,
      isLoading: false,
      isError: false,
      isStale: false,
      effectiveProgress: {
        bookingId: 'RES-001',
        checkInDate: '2026-03-10',
        currentTier: 'settle-in',
        completedTiers: [],
        tierCompletedAt: {},
      },
      refetch: jest.fn(async () => {}),
    });
    mockIsQuestProgressStale.mockReturnValue(false);

    const { result } = renderHook(() => useGuestProgressData());

    await waitFor(() => {
      expect(result.current.isQuestInitialized).toBe(true);
    });
    expect(mockSetProgress).not.toHaveBeenCalled();
  });

  it('returns first available error from booking/profile/quest sources', () => {
    const bookingError = new Error('booking failure');
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: null,
      isLoading: false,
      error: bookingError,
    } as any);

    const { result } = renderHook(() => useGuestProgressData());

    expect(result.current.error).toBe(bookingError);
  });
});

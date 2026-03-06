import '@testing-library/jest-dom';

import { useTranslation } from 'react-i18next';
import { renderHook, waitFor } from '@testing-library/react';

import { normalizeLocale } from '../../lib/i18n/normalizeLocale';

import { useDateInfo } from './useDateInfo';
import { useMealPlanEligibility } from './useMealPlanEligibility';
import { useOccupantDataSources } from './useOccupantDataSources';
import { useOccupantTransform } from './useOccupantTransform';
import { useUnifiedBookingData } from './useUnifiedBookingData';
import { useUpgradeInfo } from './useUpgradeInfo';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));
jest.mock('../../lib/i18n/normalizeLocale', () => ({
  normalizeLocale: jest.fn(),
}));
jest.mock('./useOccupantDataSources', () => ({
  useOccupantDataSources: jest.fn(),
}));
jest.mock('./useOccupantTransform', () => ({
  useOccupantTransform: jest.fn(),
}));
jest.mock('./useDateInfo', () => ({
  useDateInfo: jest.fn(),
}));
jest.mock('./useMealPlanEligibility', () => ({
  useMealPlanEligibility: jest.fn(),
}));
jest.mock('./useUpgradeInfo', () => ({
  useUpgradeInfo: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;
const mockNormalizeLocale = normalizeLocale as jest.MockedFunction<typeof normalizeLocale>;
const mockUseOccupantDataSources = useOccupantDataSources as jest.MockedFunction<typeof useOccupantDataSources>;
const mockUseOccupantTransform = useOccupantTransform as jest.MockedFunction<typeof useOccupantTransform>;
const mockUseDateInfo = useDateInfo as jest.MockedFunction<typeof useDateInfo>;
const mockUseMealPlanEligibility = useMealPlanEligibility as jest.MockedFunction<typeof useMealPlanEligibility>;
const mockUseUpgradeInfo = useUpgradeInfo as jest.MockedFunction<typeof useUpgradeInfo>;

describe('useUnifiedBookingData', () => {
  const mockRefetch = jest.fn(async () => {});
  const mockChangeLanguage = jest.fn(async () => {});

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: jest.fn((key: string) => key),
      i18n: {
        language: 'it',
        changeLanguage: mockChangeLanguage,
      },
      ready: true,
    } as any);

    mockNormalizeLocale.mockImplementation((value) => value || 'en');

    mockUseOccupantDataSources.mockReturnValue({
      bookingsData: { reservationCode: 'RES-001' } as any,
      loansData: null,
      guestDetailsData: null,
      guestRoomData: null,
      financialsData: null,
      preordersData: null,
      occupantTasks: {},
      cityTaxData: null,
      bagStorageData: null,
      isLoading: false,
      isBookingsLoading: false,
      isLoansLoading: false,
      isGuestDetailsLoading: false,
      isGuestRoomLoading: false,
      isFinancialsLoading: false,
      isPreordersLoading: false,
      isTasksLoading: false,
      isCityTaxLoading: false,
      isBagStorageLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUseOccupantTransform.mockReturnValue({
      occupantData: {
        reservationCode: 'RES-001',
        checkInDate: '2026-03-10',
        checkOutDate: '2026-03-12',
        nights: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        language: 'it',
        bookedRoom: '3',
        allocatedRoom: '5',
        loans: null,
        financials: null,
        preorders: [],
        cityTax: null,
        bagStorage: null,
      },
      occupantRoomIdKey: 'occ_1234567890123',
    });

    mockUseDateInfo.mockReturnValue({
      dateInfo: { daysUntilCheckIn: 1, daysRemaining: null },
      isCheckedIn: false,
      localTimestamp: '2026-03-05T12:00:00',
      checkInDateDDMM: '10/03',
      computedOrderDates: ['2026-03-10', '2026-03-11'],
    });

    mockUseMealPlanEligibility.mockReturnValue({
      occupantBreakfastType: 'PREPAID_MP_A',
      occupantDrink1Type: 'NA',
      occupantDrink2Type: 'NA',
      showOrderBreakfastLink: false,
      showBreakfastIncludedMessage: true,
      showOrderDrinkLinks: false,
      showDrinksIncludedMessage: false,
      drinksAllowed: 1,
      eligibility: {
        isEligibleForComplimentaryBreakfast: true,
        isEligibleForEveningDrink: false,
      },
      prepaidMealPlans: ['PREPAID_MP_A', 'PREPAID_MP_B', 'PREPAID_MP_C'],
    } as any);

    mockUseUpgradeInfo.mockReturnValue(null);
  });

  it('composes and returns unified booking payload from child hooks', async () => {
    const { result } = renderHook(() => useUnifiedBookingData());

    await waitFor(() => {
      expect(result.current.isInitialSyncComplete).toBe(true);
    });

    expect(result.current.occupantId).toBe('occ_1234567890123');
    expect(result.current.occupantData?.firstName).toBe('Jane');
    expect(result.current.dateInfo.daysUntilCheckIn).toBe(1);
    expect(result.current.occupantBreakfastType).toBe('PREPAID_MP_A');
    expect(result.current.prepaidMealPlans).toEqual(['PREPAID_MP_A', 'PREPAID_MP_B', 'PREPAID_MP_C']);
    expect(result.current.refetch).toBe(mockRefetch);
  });

  it('syncs i18n language when occupant language differs and still completes initial sync', async () => {
    mockUseTranslation.mockReturnValue({
      t: jest.fn((key: string) => key),
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
      ready: true,
    } as any);

    const { result } = renderHook(() => useUnifiedBookingData());

    await waitFor(() => {
      expect(mockChangeLanguage).toHaveBeenCalledWith('it');
      expect(result.current.isInitialSyncComplete).toBe(true);
    });
  });

  it('keeps initial sync incomplete when occupant data is missing', () => {
    mockUseOccupantTransform.mockReturnValue({
      occupantData: null,
      occupantRoomIdKey: null,
    });

    const { result } = renderHook(() => useUnifiedBookingData());

    expect(result.current.occupantData).toBeNull();
    expect(result.current.isInitialSyncComplete).toBe(false);
  });
});

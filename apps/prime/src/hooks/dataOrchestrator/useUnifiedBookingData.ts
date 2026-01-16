/**
 * useUnifiedBookingData
 *
 * Main orchestration hook that composes smaller focused hooks to provide
 * unified booking data for the Prime app.
 *
 * This hook coordinates:
 * - Data fetching (useOccupantDataSources)
 * - Data transformation (useOccupantTransform)
 * - Date calculations (useDateInfo)
 * - Meal plan eligibility (useMealPlanEligibility)
 * - Upgrade detection (useUpgradeInfo)
 * - Language sync
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BagStorageRecord } from '../../types/bagStorage';
import type { BookingOccupantData } from '../../types/bookings';
import type { CityTaxOccupantRecord } from '../../types/cityTax';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import type { FinancialsRoomRecord } from '../../types/financialsRoom';
import type { GuestDetailsRecord } from '../../types/guestsDetails';
import type { LoanOccupantRecord } from '../../types/loans';
import type { PreorderNightData } from '../../types/preorder';
import { useDateInfo, type DateInfo } from './useDateInfo';
import {
  useMealPlanEligibility,
  type OccupantEligibility,
} from './useMealPlanEligibility';
import { useOccupantDataSources } from './useOccupantDataSources';
import {
  useOccupantTransform,
  type ProcessedPreorder,
} from './useOccupantTransform';
import { useUpgradeInfo, type UpgradeInfo } from './useUpgradeInfo';

// Re-export types for consumers
export type { DateInfo, OccupantEligibility, UpgradeInfo };

/**
 * Unified occupant data structure
 */
export interface OccupantDataOrchestrated {
  reservationCode?: string;
  checkInDate?: BookingOccupantData['checkInDate'];
  checkOutDate?: BookingOccupantData['checkOutDate'];
  leadGuest?: BookingOccupantData['leadGuest'];
  roomNumbers?: BookingOccupantData['roomNumbers'];

  loans?: LoanOccupantRecord | null;
  firstName: string;
  lastName: string;
  citizenship?: string;
  dateOfBirth?: GuestDetailsRecord['dateOfBirth'];
  document?: GuestDetailsRecord['document'];
  email?: string;
  gender?: string;
  language?: string;
  municipality?: string;
  placeOfBirth?: string;

  allocatedRoom?: string;
  bookedRoom?: string;

  financials?: FinancialsRoomRecord | null;
  preorders?: Array<PreorderNightData & { id: string; night: string }>;
  completedTasks?: OccupantCompletedTasks;

  cityTax?: CityTaxOccupantRecord | null;
  bagStorage?: BagStorageRecord | null;

  paymentTerms?: boolean;
  nights?: number;
}

export type UnifiedOccupantData = OccupantDataOrchestrated;

export interface UnifiedBookingData {
  occupantData: UnifiedOccupantData | null;
  occupantId: string | null;
  isLoading: boolean;
  error: unknown;
  isInitialSyncComplete: boolean;
  dateInfo: DateInfo;
  upgradeInfo: UpgradeInfo | null;
  isCheckedIn: boolean;
  prepaidMealPlans: readonly string[];
  showOrderBreakfastLink: boolean;
  showBreakfastIncludedMessage: boolean;
  drinksAllowed: number;
  showOrderDrinkLinks: boolean;
  showDrinksIncludedMessage: boolean;
  localTimestamp: string;
  checkInDateDDMM: string;
  computedOrderDates: string[];
  eligibility: OccupantEligibility;
  occupantBreakfastType: string;
  occupantDrink1Type: string;
  occupantDrink2Type: string;
  refetch: () => Promise<void>;
}

/**
 * Map internal transformed data to the public OccupantDataOrchestrated interface
 */
function mapToOccupantData(
  transformed: ReturnType<typeof useOccupantTransform>['occupantData']
): UnifiedOccupantData | null {
  if (!transformed) return null;

  return {
    reservationCode: transformed.reservationCode,
    checkInDate: transformed.checkInDate,
    checkOutDate: transformed.checkOutDate,
    leadGuest: transformed.leadGuest,
    roomNumbers: transformed.roomNumbers,
    nights: transformed.nights,
    loans: transformed.loans,
    firstName: transformed.firstName,
    lastName: transformed.lastName,
    citizenship: transformed.citizenship,
    dateOfBirth: transformed.dateOfBirth,
    document: transformed.document,
    email: transformed.email,
    gender: transformed.gender,
    language: transformed.language,
    municipality: transformed.municipality,
    placeOfBirth: transformed.placeOfBirth,
    allocatedRoom: transformed.allocatedRoom,
    bookedRoom: transformed.bookedRoom,
    financials: transformed.financials,
    preorders: transformed.preorders,
    completedTasks: transformed.completedTasks,
    paymentTerms: transformed.paymentTerms,
    cityTax: transformed.cityTax,
    bagStorage: transformed.bagStorage,
  };
}

export function useUnifiedBookingData(): UnifiedBookingData {
  const { t, i18n } = useTranslation(['BookingDetails', 'rooms']);

  // 1) Fetch all raw data sources
  const dataSources = useOccupantDataSources();

  // 2) Transform raw data into unified structure
  const { occupantData: transformedData, occupantRoomIdKey } =
    useOccupantTransform({
      bookingsData: dataSources.bookingsData,
      loansData: dataSources.loansData,
      guestDetailsData: dataSources.guestDetailsData,
      guestRoomData: dataSources.guestRoomData,
      financialsData: dataSources.financialsData,
      preordersData: dataSources.preordersData,
      occupantTasks: dataSources.occupantTasks,
      cityTaxData: dataSources.cityTaxData,
      bagStorageData: dataSources.bagStorageData,
    });

  // Map to public interface
  const occupantData = mapToOccupantData(transformedData);

  // 3) Calculate date-related information
  const {
    dateInfo,
    isCheckedIn,
    localTimestamp,
    checkInDateDDMM,
    computedOrderDates,
  } = useDateInfo({
    checkInDate: transformedData?.checkInDate,
    nights: transformedData?.nights,
  });

  // 4) Calculate meal plan eligibility
  const {
    occupantBreakfastType,
    occupantDrink1Type,
    occupantDrink2Type,
    showOrderBreakfastLink,
    showBreakfastIncludedMessage,
    showOrderDrinkLinks,
    showDrinksIncludedMessage,
    drinksAllowed,
    eligibility,
    prepaidMealPlans,
  } = useMealPlanEligibility({
    preorders: (transformedData?.preorders ?? []) as ProcessedPreorder[],
    isCheckedIn,
  });

  // 5) Detect room upgrades
  const upgradeInfo = useUpgradeInfo({
    bookedRoom: transformedData?.bookedRoom,
    allocatedRoom: transformedData?.allocatedRoom,
    t,
  });

  // 6) Manage language sync
  const [hasSyncedLanguage, setHasSyncedLanguage] = useState<boolean>(false);

  useEffect(() => {
    if (!occupantData) {
      setHasSyncedLanguage(false);
      return;
    }
    const occupantLang = occupantData.language || 'en';

    if (i18n.language === occupantLang) {
      setHasSyncedLanguage(true);
      return;
    }

    void i18n.changeLanguage(occupantLang).then(() => {
      setHasSyncedLanguage(true);
    });
  }, [occupantData, i18n]);

  // 7) Determine initial sync complete status
  const isInitialSyncComplete =
    !dataSources.isLoading && occupantData !== null && hasSyncedLanguage;

  return {
    occupantData,
    occupantId: occupantRoomIdKey,
    isLoading: dataSources.isLoading,
    error: dataSources.error,
    isInitialSyncComplete,
    dateInfo,
    upgradeInfo,
    isCheckedIn,
    prepaidMealPlans,
    showOrderBreakfastLink,
    showBreakfastIncludedMessage,
    drinksAllowed,
    showOrderDrinkLinks,
    showDrinksIncludedMessage,
    localTimestamp,
    checkInDateDDMM,
    computedOrderDates,
    eligibility,
    occupantBreakfastType,
    occupantDrink1Type,
    occupantDrink2Type,
    refetch: dataSources.refetch,
  };
}

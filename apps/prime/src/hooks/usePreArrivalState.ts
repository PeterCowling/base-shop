/**
 * usePreArrivalState
 *
 * Hook that determines the guest's arrival state and manages pre-arrival data.
 * Combines arrival state logic with pre-arrival data fetching.
 */

import { useCallback, useMemo } from 'react';
import { getGuestArrivalState, shouldShowPreArrivalDashboard } from '../lib/preArrival';
import type {
  ArrivalConfidence,
  ChecklistProgress,
  EtaMethod,
  GuestArrivalState,
  PreArrivalData,
} from '../types/preArrival';
import { DEFAULT_PRE_ARRIVAL } from '../types/preArrival';
import { usePreArrivalMutator } from './mutator/usePreArrivalMutator';
import { useFetchPreArrivalData } from './pureData/useFetchPreArrivalData';

/**
 * Default deposit amount (keycard deposit).
 */
const KEYCARD_DEPOSIT = 10; // EUR

/**
 * City tax rate per person per night.
 */
const CITY_TAX_RATE = 3; // EUR

interface UsePreArrivalStateOptions {
  /** Check-in date (ISO format YYYY-MM-DD) */
  checkInDate: string | undefined;
  /** Check-out date (ISO format YYYY-MM-DD) */
  checkOutDate: string | undefined;
  /** Whether the guest has checked in */
  isCheckedIn: boolean;
  /** Number of nights */
  nights: number;
  /** City tax total due (if available from booking) */
  cityTaxDue?: number;
}

export interface UsePreArrivalStateReturn {
  /** Current arrival state */
  arrivalState: GuestArrivalState;
  /** Whether to show the pre-arrival dashboard */
  showPreArrivalDashboard: boolean;
  /** Pre-arrival data */
  preArrivalData: PreArrivalData;
  /** Loading state */
  isLoading: boolean;
  /** Cash amounts needed for check-in */
  cashAmounts: {
    cityTax: number;
    deposit: number;
  };
  /** Handler to update a checklist item */
  updateChecklistItem: (item: keyof ChecklistProgress, completed: boolean) => Promise<void>;
  /** Handler to set ETA */
  setEta: (window: string | null, method: string | null, note?: string) => Promise<void>;
  /** Handler to mark cash ready */
  setCashReady: (cityTax: boolean, deposit: boolean) => Promise<void>;
  /** Handler to save a route */
  saveRoute: (routeSlug: string | null) => Promise<void>;
  /** Handler to persist onboarding personalization context */
  setPersonalization: (
    method: EtaMethod | null,
    confidence: ArrivalConfidence | null,
  ) => Promise<void>;
  /** Refetch pre-arrival data */
  refetch: () => Promise<void>;
}

/**
 * usePreArrivalState
 *
 * Manages the complete pre-arrival state for a guest.
 */
export function usePreArrivalState(
  options: UsePreArrivalStateOptions,
): UsePreArrivalStateReturn {
  const {
    checkInDate,
    checkOutDate,
    isCheckedIn,
    nights,
    cityTaxDue,
  } = options;

  // Determine arrival state
  const arrivalState = useMemo((): GuestArrivalState => {
    if (!checkInDate || !checkOutDate) {
      return 'checked-in'; // Default to checked-in if dates unavailable
    }
    return getGuestArrivalState(checkInDate, checkOutDate, isCheckedIn);
  }, [checkInDate, checkOutDate, isCheckedIn]);

  // Should show pre-arrival dashboard?
  const showPreArrivalDashboard = useMemo((): boolean => {
    if (!checkInDate || !checkOutDate) {
      return false;
    }
    return shouldShowPreArrivalDashboard(checkInDate, checkOutDate, isCheckedIn);
  }, [checkInDate, checkOutDate, isCheckedIn]);

  // Fetch pre-arrival data
  const {
    effectiveData: preArrivalData,
    isLoading,
    refetch,
  } = useFetchPreArrivalData({
    enabled: showPreArrivalDashboard,
  });

  // Mutators
  const {
    updateChecklistItem: updateItem,
    setEta: setEtaMutator,
    setCashReadyCityTax,
    setCashReadyDeposit,
    saveRoute: saveRouteMutator,
    setPersonalization: setPersonalizationMutator,
  } = usePreArrivalMutator();

  // Calculate cash amounts
  const cashAmounts = useMemo(() => {
    // Use city tax from booking if available, otherwise estimate
    const cityTax = cityTaxDue ?? (nights * CITY_TAX_RATE);
    return {
      cityTax,
      deposit: KEYCARD_DEPOSIT,
    };
  }, [nights, cityTaxDue]);

  // Wrapped handlers
  const updateChecklistItem = useCallback(
    async (item: keyof ChecklistProgress, completed: boolean): Promise<void> => {
      await updateItem(item, completed);
    },
    [updateItem],
  );

  const setEta = useCallback(
    async (
      window: string | null,
      method: string | null,
      note?: string,
    ): Promise<void> => {
      await setEtaMutator(
        window,
        method as Parameters<typeof setEtaMutator>[1],
        note,
      );
    },
    [setEtaMutator],
  );

  const setCashReady = useCallback(
    async (cityTax: boolean, deposit: boolean): Promise<void> => {
      await setCashReadyCityTax(cityTax);
      await setCashReadyDeposit(deposit);
      // Mark checklist item as complete if both are ready
      if (cityTax && deposit) {
        await updateItem('cashPrepared', true);
      }
    },
    [setCashReadyCityTax, setCashReadyDeposit, updateItem],
  );

  const saveRoute = useCallback(
    async (routeSlug: string | null): Promise<void> => {
      await saveRouteMutator(routeSlug);
    },
    [saveRouteMutator],
  );

  const setPersonalization = useCallback(
    async (
      method: EtaMethod | null,
      confidence: ArrivalConfidence | null,
    ): Promise<void> => {
      await setPersonalizationMutator(method, confidence);
    },
    [setPersonalizationMutator],
  );

  return {
    arrivalState,
    showPreArrivalDashboard,
    preArrivalData: preArrivalData ?? DEFAULT_PRE_ARRIVAL,
    isLoading,
    cashAmounts,
    updateChecklistItem,
    setEta,
    setCashReady,
    saveRoute,
    setPersonalization,
    refetch,
  };
}

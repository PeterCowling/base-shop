'use client';

/**
 * useOccupantDataSources
 *
 * Aggregates all the raw data fetching hooks for occupant data.
 * This hook is responsible ONLY for fetching - no transformation.
 *
 * OPT-03: Implements phased loading to reduce initial page load queries:
 *   Phase 1 (primary): bookings + completedTasks — fires immediately
 *   Phase 2 (secondary): loans, guestByRoom, preorders, bagStorage — deferred
 *     until bookings data resolves
 *   Dependent: guestDetails, financials, cityTax — naturally waits for bookingRef
 */

import { useCallback } from 'react';
import type { BagStorageRecord } from '../../types/bagStorage';
import type { BookingDetails } from '../pureData/useFetchBookingsData';
import type { CityTaxRecord } from '../../types/cityTax';
import type { OccupantCompletedTasks } from '../../types/completedTasks';
import type { FinancialsRoomRecord } from '../../types/financialsRoom';
import type { GuestByRoomRecord } from '../../types/guestByRoom';
import type { GuestDetailsRecord } from '../../types/guestsDetails';
import type { LoanOccupantRecord } from '../../types/loans';
import type { PreorderNightData } from '../../types/preorder';
import { useFetchBagStorageData } from '../pureData/useFetchBagStorageData';
import { useFetchBookingsData } from '../pureData/useFetchBookingsData';
import { useFetchCityTax } from '../pureData/useFetchCityTax';
import { useFetchCompletedTasks } from '../pureData/useFetchCompletedTasksData';
import { useFetchFinancialsRoom } from '../pureData/useFetchFinancialsRoom';
import { useFetchGuestByRoom } from '../pureData/useFetchGuestByRoom';
import { useFetchGuestDetails } from '../pureData/useFetchGuestDetails';
import { useFetchLoans } from '../pureData/useFetchLoans';
import { useFetchPreordersData } from '../pureData/useFetchPreordersData';

export interface OccupantPreordersData {
  [nightKey: string]: PreorderNightData;
}

export interface PreordersDataRecord {
  [occupantId: string]: OccupantPreordersData;
}

export interface OccupantDataSources {
  // Raw data
  bookingsData: BookingDetails | null;
  loansData: LoanOccupantRecord | null;
  guestDetailsData: GuestDetailsRecord | null;
  guestRoomData: Record<string, GuestByRoomRecord> | null;
  financialsData: FinancialsRoomRecord | null;
  preordersData: PreorderNightData[] | PreordersDataRecord | null;
  occupantTasks: OccupantCompletedTasks | undefined;
  cityTaxData: CityTaxRecord | null;
  bagStorageData: BagStorageRecord | null;

  // Loading states
  isLoading: boolean;
  isBookingsLoading: boolean;
  isLoansLoading: boolean;
  isGuestDetailsLoading: boolean;
  isGuestRoomLoading: boolean;
  isFinancialsLoading: boolean;
  isPreordersLoading: boolean;
  isTasksLoading: boolean;
  isCityTaxLoading: boolean;
  isBagStorageLoading: boolean;

  // Errors
  error: unknown;

  // Refetch
  refetch: () => Promise<void>;
}

export function useOccupantDataSources(): OccupantDataSources {
  // ── Phase 1: Primary data (fires immediately) ──────────────────────────

  // 1) Bookings (primary data source — everything depends on this)
  const {
    bookingsData,
    isLoading: isBookingsLoading,
    error: bookingsError,
    refetch: refetchBookingsData,
  } = useFetchBookingsData();

  // 7) Completed tasks (real-time via onValue, independent of bookings)
  const {
    occupantTasks,
    isLoading: isTasksLoading,
    isError: tasksError,
  } = useFetchCompletedTasks();

  // ── Phase 2: Secondary data (deferred until bookings resolves) ─────────
  const secondaryEnabled = !!bookingsData;

  // 2) Loans
  const {
    data: loansData,
    isLoading: isLoansLoading,
    error: loansError,
    refetch: refetchLoansData,
  } = useFetchLoans({ enabled: secondaryEnabled });

  // 4) Guest room allocation
  const {
    data: guestRoomData,
    isLoading: isGuestRoomLoading,
    error: guestRoomError,
    refetch: refetchGuestByRoom,
  } = useFetchGuestByRoom({ enabled: secondaryEnabled });

  // 6) Preorders
  const {
    preordersData,
    isLoading: isPreordersLoading,
    error: preordersError,
    refetch: refetchPreordersData,
  } = useFetchPreordersData();

  // 9) Bag storage
  const {
    bagStorageData,
    isLoading: isBagStorageLoading,
    error: bagStorageError,
  } = useFetchBagStorageData({ enabled: secondaryEnabled });

  // ── Dependent: Requires bookingRef from bookings ───────────────────────
  const bookingRef = bookingsData?.reservationCode || '';

  // 3) Guest details
  const {
    data: guestDetailsData,
    isLoading: isGuestDetailsLoading,
    error: guestDetailsError,
    refetch: refetchGuestDetails,
  } = useFetchGuestDetails(bookingRef);

  // 5) Financials
  const {
    data: financialsData,
    isLoading: isFinancialsLoading,
    error: financialsError,
    refetch: refetchFinancialsRoom,
  } = useFetchFinancialsRoom(bookingRef);

  // 8) City tax
  const {
    data: cityTaxData,
    isLoading: isCityTaxLoading,
    error: cityTaxError,
    refetch: refetchCityTax,
  } = useFetchCityTax(bookingRef);

  // ── Aggregate refetch (except tasks which is real-time) ────────────────
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchBookingsData?.(),
      refetchLoansData?.(),
      refetchGuestDetails?.(),
      refetchGuestByRoom?.(),
      refetchFinancialsRoom?.(),
      refetchPreordersData?.(),
      refetchCityTax?.(),
    ]);
  }, [
    refetchBookingsData,
    refetchLoansData,
    refetchGuestDetails,
    refetchGuestByRoom,
    refetchFinancialsRoom,
    refetchPreordersData,
    refetchCityTax,
  ]);

  // Primary loading: only bookings + tasks needed for initial render
  const isPrimaryLoading = isBookingsLoading || isTasksLoading;

  // Full loading: all sources (used for isInitialSyncComplete in unified hook)
  const isLoading =
    isPrimaryLoading ||
    isLoansLoading ||
    isGuestDetailsLoading ||
    isGuestRoomLoading ||
    isFinancialsLoading ||
    isPreordersLoading ||
    isCityTaxLoading ||
    isBagStorageLoading;

  // Combine errors
  const error =
    bookingsError ||
    loansError ||
    guestDetailsError ||
    guestRoomError ||
    financialsError ||
    preordersError ||
    (tasksError ? new Error('Failed to load occupant tasks') : null) ||
    cityTaxError ||
    bagStorageError;

  return {
    bookingsData,
    loansData: loansData ?? null,
    guestDetailsData: guestDetailsData ?? null,
    guestRoomData: guestRoomData ?? null,
    financialsData: financialsData ?? null,
    preordersData: preordersData ?? null,
    occupantTasks,
    cityTaxData: cityTaxData ?? null,
    bagStorageData: bagStorageData ?? null,
    isLoading,
    isBookingsLoading,
    isLoansLoading,
    isGuestDetailsLoading,
    isGuestRoomLoading,
    isFinancialsLoading,
    isPreordersLoading,
    isTasksLoading,
    isCityTaxLoading,
    isBagStorageLoading,
    error,
    refetch,
  };
}

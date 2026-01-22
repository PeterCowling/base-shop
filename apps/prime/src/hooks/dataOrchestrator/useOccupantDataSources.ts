'use client';

/**
 * useOccupantDataSources
 *
 * Aggregates all the raw data fetching hooks for occupant data.
 * This hook is responsible ONLY for fetching - no transformation.
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
  // 1) Bookings (primary data source)
  const {
    bookingsData,
    isLoading: isBookingsLoading,
    error: bookingsError,
    refetch: refetchBookingsData,
  } = useFetchBookingsData();

  // 2) Loans
  const {
    data: loansData,
    isLoading: isLoansLoading,
    error: loansError,
    refetch: refetchLoansData,
  } = useFetchLoans();

  // 3) Guest details (depends on reservationCode)
  const {
    data: guestDetailsData,
    isLoading: isGuestDetailsLoading,
    error: guestDetailsError,
    refetch: refetchGuestDetails,
  } = useFetchGuestDetails(bookingsData?.reservationCode || '');

  // 4) Guest room allocation
  const {
    data: guestRoomData,
    isLoading: isGuestRoomLoading,
    error: guestRoomError,
    refetch: refetchGuestByRoom,
  } = useFetchGuestByRoom();

  // 5) Financials (depends on reservationCode)
  const {
    data: financialsData,
    isLoading: isFinancialsLoading,
    error: financialsError,
    refetch: refetchFinancialsRoom,
  } = useFetchFinancialsRoom(bookingsData?.reservationCode || '');

  // 6) Preorders
  const {
    preordersData,
    isLoading: isPreordersLoading,
    error: preordersError,
    refetch: refetchPreordersData,
  } = useFetchPreordersData();

  // 7) Completed tasks (real-time via onValue, no refetch needed)
  const {
    occupantTasks,
    isLoading: isTasksLoading,
    isError: tasksError,
  } = useFetchCompletedTasks();

  // 8) City tax (depends on reservationCode)
  const {
    data: cityTaxData,
    isLoading: isCityTaxLoading,
    error: cityTaxError,
    refetch: refetchCityTax,
  } = useFetchCityTax(bookingsData?.reservationCode || '');

  // 9) Bag storage
  const {
    bagStorageData,
    isLoading: isBagStorageLoading,
    error: bagStorageError,
  } = useFetchBagStorageData();

  // Aggregate refetch (except tasks which is real-time)
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

  // Combine loading states
  const isLoading =
    isBookingsLoading ||
    isLoansLoading ||
    isGuestDetailsLoading ||
    isGuestRoomLoading ||
    isFinancialsLoading ||
    isPreordersLoading ||
    isTasksLoading ||
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

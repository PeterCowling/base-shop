/* src/hooks/client/useBookingSearchClient.tsx */
import { useEffect, useMemo, useState } from "react";

import useActivitiesData from "../../hooks/data/useActivitiesData";
import useFinancialsRoom from "../../hooks/data/useFinancialsRoom";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import {
  BookingSearchRow,
  UseBookingSearchDataParams,
  UseBookingSearchDataResult,
} from "../../types/component/bookingSearch";
import {
  buildBookingSearchRows,
  getMaxActivityCode,
} from "./bookingSearchUtils";
import useBookings from "../data/useBookingsData";
import { useCheckins } from "../data/useCheckins";
import { useCheckouts } from "../data/useCheckouts";
import useGuestByRoom from "../data/useGuestByRoom";

/**
 * Client hook that aggregates bookings, guests, financials, activities, check-ins/outs,
 * and returns a filtered, occupant-centric “booking search” dataset.
 */
export default function useBookingSearchClient(
  params: UseBookingSearchDataParams
): UseBookingSearchDataResult {
  const {
    skip,
    firstName,
    lastName,
    bookingRef,
    status,
    nonRefundable,
    date,
    roomNumber,
  } = params;

  const LIMIT = 500;
  const bookingQuery = bookingRef
    ? { startAt: bookingRef, endAt: bookingRef }
    : { limitToFirst: LIMIT };
  const dateQuery = date
    ? { startAt: date, endAt: date }
    : { limitToFirst: LIMIT };

  // 1) Fetch bookings
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookings(bookingQuery);

  // 2) Fetch guest details
  const {
    guestsDetails,
    loading: guestsLoading,
    error: guestsError,
    validationError: _guestValErr,
  } = useGuestDetails(bookingQuery);

  // 3) Fetch financials
  const {
    financialsRoom,
    loading: finLoading,
    error: finError,
  } = useFinancialsRoom(bookingQuery);

  // 4) Fetch occupant activities
  const {
    activities,
    loading: actLoading,
    error: actError,
  } = useActivitiesData({ limitToFirst: LIMIT });

  // 5) Fetch check-ins
  const {
    checkins,
    loading: checkinsLoading,
    error: checkinsError,
  } = useCheckins(dateQuery);

  // 6) Fetch check-outs
  const {
    checkouts,
    loading: checkoutsLoading,
    error: checkoutsError,
  } = useCheckouts(dateQuery);

  // 7) Fetch guest-by-room mapping
  const {
    guestByRoom,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useGuestByRoom({ limitToFirst: LIMIT });

  // Collate loading & error states
  const loading = skip
    ? false
    : bookingsLoading ||
      guestsLoading ||
      finLoading ||
      actLoading ||
      checkinsLoading ||
      checkoutsLoading ||
      guestByRoomLoading;

  const error = skip
    ? null
    : bookingsError ||
      guestsError ||
      finError ||
      actError ||
      checkinsError ||
      checkoutsError ||
      guestByRoomError;

  const [tableData, setTableData] = useState<BookingSearchRow[]>([]);

  useEffect(() => {
    // If skipping, still loading, or any error => clear table data
    if (skip || loading || error) {
      setTableData([]);
      return;
    }

    if (!bookings) {
      setTableData([]);
      return;
    }

    const rows = buildBookingSearchRows({
      bookings,
      guestsDetails,
      financialsRoom,
      activities,
      checkins,
      checkouts,
      guestByRoom,
      filters: {
        firstName,
        lastName,
        bookingRef,
        status,
        nonRefundable,
        date,
        roomNumber,
      },
    });

    setTableData(rows);
  }, [
    skip,
    loading,
    error,
    bookings,
    guestsDetails,
    financialsRoom,
    activities,
    checkins,
    checkouts,
    guestByRoom,
    firstName,
    lastName,
    bookingRef,
    status,
    nonRefundable,
    date,
    roomNumber,
  ]);

  const data = useMemo(() => tableData, [tableData]);

  return { data, loading, error };
}

export { getMaxActivityCode };

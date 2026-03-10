// File: /src/components/loans/useGuestLoanData.ts

import { useMemo } from "react";

import useBookings from "../../hooks/data/useBookingsData";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import { type FirebaseBookingOccupant } from "../../types/hooks/data/bookingsData";
import { isDateWithinRange } from "../../utils/dateUtils";

/* -------------------------------------------------------------------------
   LOCAL TYPES
   ------------------------------------------------------------------------- */

interface GuestRow {
  bookingRef: string;
  occupantId: string;
  firstName: string;
  lastName: string;
}

interface UseGuestLoanDataResult {
  data: GuestRow[];
  loading: boolean;
  error: string | null;
}

interface UseGuestLoanDataParams {
  selectedDate: string;
}

/**
 * Gathers booking + guest details for the selected date,
 * returning occupant rows used by the Loans table.
 */
export function useGuestLoanData({
  selectedDate,
}: UseGuestLoanDataParams): UseGuestLoanDataResult {
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookings();
  const {
    guestsDetails,
    loading: guestDetailsLoading,
    error: guestDetailsError,
    validationError: _guestValErr,
  } = useGuestDetails();

  const loading = bookingsLoading || guestDetailsLoading;
  const combinedError = bookingsError || guestDetailsError;
  const error = combinedError ? String(combinedError) : null;

  const data = useMemo<GuestRow[]>(() => {
    if (loading || error || !bookings || !guestsDetails) return [];

    const rows: GuestRow[] = [];
    Object.entries(bookings).forEach(([bookingRef, guestsObj]) => {
      if (!guestsObj) return;
      Object.entries(guestsObj).forEach(([guestId, guestBooking]) => {
        if (guestId.startsWith("__")) return;
        const occ = guestBooking as FirebaseBookingOccupant | undefined;
        const { checkInDate, checkOutDate } = occ || {};
        if (!checkInDate || !checkOutDate) return;
        if (!isDateWithinRange(selectedDate, checkInDate, checkOutDate)) return;
        const guestDetail = guestsDetails?.[bookingRef]?.[guestId];
        rows.push({
          bookingRef,
          occupantId: guestId,
          firstName: guestDetail?.firstName || "",
          lastName: guestDetail?.lastName || "",
        });
      });
    });
    return rows;
  }, [bookings, guestsDetails, loading, error, selectedDate]);

  return {
    data,
    loading,
    error,
  };
}

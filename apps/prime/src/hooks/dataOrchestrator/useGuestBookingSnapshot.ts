'use client';

import { useQuery } from '@tanstack/react-query';

import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import { GUEST_CRITICAL_FLOW_ENDPOINTS } from '@/lib/security/guestCriticalFlowEndpoints';

export type GuestArrivalState = 'pre-arrival' | 'arrival-day' | 'checked-in' | 'checked-out';

export interface GuestBookingSnapshot {
  bookingId: string;
  guestUuid: string;
  guestName: string;
  reservationCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumbers: string[];
  roomAssignment: string;
  isCheckedIn: boolean;
  arrivalState: GuestArrivalState;
  preorders: Record<
    string,
    {
      night: string;
      breakfast: string;
      drink1: string;
      drink2: string;
      serviceDate?: string;
      /** txnId of the placed breakfast bar order (backref; breakfast field is NOT overwritten) */
      breakfastTxnId?: string;
      /** Original pipe-delimited breakfast order string for human-readable display */
      breakfastText?: string;
      /** txnId of the placed evening drink bar order (drink1 field is NOT overwritten) */
      drink1Txn?: string;
      /** Original pipe-delimited drink order string for human-readable display */
      drink1Text?: string;
    }
  >;
  bagStorage: {
    optedIn?: boolean;
    requestStatus?: string;
    pickupWindow?: string;
    note?: string;
    requestId?: string;
  } | null;
  requestSummary: {
    extension?: { requestId: string; status: string } | null;
    bag_drop?: { requestId: string; status: string } | null;
    meal_change_exception?: { requestId: string; status: string } | null;
  };
}

async function fetchGuestBookingSnapshot(): Promise<GuestBookingSnapshot> {
  // prime_session HttpOnly cookie is sent automatically on this same-origin request
  const response = await fetch(GUEST_CRITICAL_FLOW_ENDPOINTS.booking_details);
  if (!response.ok) {
    if (response.status === 410) {
      throw new Error('session_expired');
    }
    throw new Error('booking_snapshot_failed');
  }
  return await response.json() as GuestBookingSnapshot;
}

export function useGuestBookingSnapshot() {
  const session = readGuestSession();

  const query = useQuery({
    queryKey: ['guest-booking-snapshot', session.bookingId],
    enabled: Boolean(session.bookingId),
    queryFn: fetchGuestBookingSnapshot,
    staleTime: 30 * 1000,
  });

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

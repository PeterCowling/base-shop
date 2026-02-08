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

async function fetchGuestBookingSnapshot(token: string): Promise<GuestBookingSnapshot> {
  const response = await fetch(
    `${GUEST_CRITICAL_FLOW_ENDPOINTS.booking_details}?token=${encodeURIComponent(token)}`,
  );
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
  const token = session.token;

  const query = useQuery({
    queryKey: ['guest-booking-snapshot', token],
    enabled: Boolean(token),
    queryFn: () => fetchGuestBookingSnapshot(token!),
    staleTime: 30 * 1000,
  });

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    token,
  };
}

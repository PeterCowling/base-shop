// src/types/component/bookingSearch.ts

import { type Activity } from "../hooks/data/activitiesData";
import { type FinancialsRoomData } from "../hooks/data/financialsRoomData";

/**
 * Represents a simplified Guest for booking search display.
 */
export interface Guest {
  _key?: string;
  bookingRef: string;
  guestId: string;
  firstName: string;
  lastName: string;
  activityLevel: string;
  refundStatus: string;
}

/**
 * Data structure describing a single occupant's booking info.
 */
export interface BookingOccupantData {
  checkInDate: string;
  checkOutDate: string;
  leadGuest: boolean;
  roomNumbers: (string | number)[];
}

export type BookingsData = Record<string, Record<string, BookingOccupantData>>;

/**
 * A row in our "booking search" data set, containing occupant + booking details.
 * Notice we use the canonical FinancialsRoomData from `financialsRoom.ts`.
 */
export interface BookingSearchRow {
  bookingRef: string;
  occupantId: string;
  firstName: string;
  lastName: string;
  rooms: (string | number)[];
  financials: FinancialsRoomData;
  activities: Activity[];
  citizenship: string;
  placeOfBirth: string;
  dateOfBirth: string | null;
  municipality: string;
  gender: string;
  nonRefundable: boolean;
}

/**
 * Parameters passed into our booking search hook.
 */
export interface UseBookingSearchDataParams {
  firstName?: string;
  lastName?: string;
  bookingRef?: string;
  status?: string;
  nonRefundable?: string;
  /** Optional date string (YYYY-MM-DD) to filter by check-ins or check-outs */
  date?: string;
  /** Optional room number to filter by */
  roomNumber?: string | number;
  skip?: boolean;
}

/**
 * Result object returned by our booking search hook.
 */
export interface UseBookingSearchDataResult {
  data: BookingSearchRow[];
  loading: boolean;
  error: unknown;
}

// /src/types/bookings.ts
import type { IndexedById } from './indexedById';

/**
 * Occupant's info within a booking.
 */
export interface BookingOccupantData {
  checkInDate: string;
  checkOutDate: string;
  leadGuest: boolean;
  roomNumbers: string[];
  /** Optional reservation code */
  reservationCode?: string;
}

/**
 * A single booking can have multiple occupants:
 * occupant_id => BookingOccupantData
 */
export type BookingOccupants = IndexedById<BookingOccupantData>;

/**
 * The entire "bookings" node in Firebase:
 * booking_reference => BookingOccupants
 */
export type Bookings = IndexedById<BookingOccupants>;

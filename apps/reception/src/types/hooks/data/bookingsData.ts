/* src/types/hooks/data/bookingsData.ts */

import { BookingNotes } from "./bookingNotesData";

/**
 * Represents booking details for a single occupant under a booking reference.
 *
 *   checkInDate: "2025-03-20",   // Scheduled arrival date (YYYY-MM-DD)
 *   checkOutDate: "2025-03-26",  // Scheduled departure date (YYYY-MM-DD)
 *   leadGuest: true,             // Indicates whether the occupant is the primary guest for the booking
 *   roomNumbers: ["6"]           // List of room numbers allocated to this occupant
 */
export interface FirebaseBookingOccupant {
  checkInDate?: string;
  checkOutDate?: string;
  leadGuest?: boolean;
  roomNumbers?: (string | number)[];
}

export interface FirebaseBooking {
  __notes?: BookingNotes;
  [occupantId: string]: FirebaseBookingOccupant | BookingNotes | undefined;
}

/**
 * A map of bookingRef -> occupantId -> FirebaseBookingOccupant.
 *
 * Structure:
 *   "bookings": {
 *     "<booking_reference>": {
 *       "<occupant_id>": {
 *         checkInDate: "<YYYY-MM-DD>",
 *         checkOutDate: "<YYYY-MM-DD>",
 *         leadGuest: <boolean>,
 *         roomNumbers: [ "<string or number>", ... ]
 *       }
 *     }
 *   }
 *
 * Example:
 *   "bookings": {
 *     "4092716050": {
 *       "occ_1740508445159": {
 *         checkInDate: "2025-03-20",
 *         checkOutDate: "2025-03-26",
 *         leadGuest: true,
 *         roomNumbers: ["6"]
 *       }
 *     }
 *   }
 */
export type FirebaseBookings = Record<string, FirebaseBooking>;

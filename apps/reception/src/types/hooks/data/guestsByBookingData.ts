/* src/types/hooks/data/guestsByBookingData.ts */

/**
 * Represents occupant data for a single entry in the "guestsByBooking" node.
 *
 *   reservationCode: "DT1PO8" // Code representing the occupant's reservation
 */
export interface GuestByBookingRecord {
  reservationCode: string;
}

/**
 * A map of occupantId -> GuestByBookingRecord.
 *
 *   "occ_1741690203417": {
 *     reservationCode: "DT1PO8"
 *   }
 */
export interface GuestsByBookingData {
  [occupantId: string]: GuestByBookingRecord;
}

/**
 * The entire "guestsByBooking" node. It may be null if there is no data.
 *
 *   "guestsByBooking": {
 *     "occ_1741690203417": {
 *       reservationCode: "DT1PO8"
 *     }
 *   }
 */
export type GuestsByBooking = GuestsByBookingData | null;

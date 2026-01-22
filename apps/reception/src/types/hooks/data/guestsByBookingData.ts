/* src/types/hooks/data/guestsByBookingData.ts */

import type {
  GuestByBookingRecord,
  GuestsByBookingData,
} from "../../../schemas/guestsByBookingSchema";

export type { GuestByBookingRecord, GuestsByBookingData };

export type GuestsByBooking = GuestsByBookingData | null;

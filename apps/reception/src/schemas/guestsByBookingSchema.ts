import { z } from "zod";

export const guestByBookingRecordSchema = z.object({
  reservationCode: z.string(),
});

export const guestsByBookingSchema = z.record(guestByBookingRecordSchema);

export type GuestByBookingRecord = z.infer<typeof guestByBookingRecordSchema>;
export type GuestsByBookingData = z.infer<typeof guestsByBookingSchema>;

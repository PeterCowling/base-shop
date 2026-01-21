import { z } from "zod";

import { bookingNotesSchema } from "./bookingNoteSchema";

export const firebaseBookingOccupantSchema = z
  .object({
    checkInDate: z.string().optional(),
    checkOutDate: z.string().optional(),
    leadGuest: z.boolean().optional(),
    roomNumbers: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .strict();

export type FirebaseBookingOccupant = z.infer<
  typeof firebaseBookingOccupantSchema
>;

export const firebaseBookingSchema = z
  .object({
    __notes: bookingNotesSchema.optional(),
  })
  .catchall(firebaseBookingOccupantSchema);

export type FirebaseBooking = z.infer<typeof firebaseBookingSchema>;

export const firebaseBookingsSchema = z.record(firebaseBookingSchema);

export type FirebaseBookings = z.infer<typeof firebaseBookingsSchema>;

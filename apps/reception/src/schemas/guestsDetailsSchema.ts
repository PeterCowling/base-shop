import { z } from "zod";

import { occupantDetailsSchema } from "./occupantDetailsSchema";

export const bookingOccupantDetailsSchema = z.record(occupantDetailsSchema);

export const guestsDetailsSchema = z.record(bookingOccupantDetailsSchema);

export type BookingOccupantDetails = z.infer<
  typeof bookingOccupantDetailsSchema
>;
export type GuestsDetails = z.infer<typeof guestsDetailsSchema>;

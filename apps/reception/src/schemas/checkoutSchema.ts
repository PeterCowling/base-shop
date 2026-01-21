import { z } from "zod";

import { bookingNotesSchema } from "./bookingNoteSchema";

export const checkoutRecordSchema = z.object({
  reservationCode: z.string().optional(),
  timestamp: z.string().optional(),
  __notes: bookingNotesSchema.optional(),
});

export const checkoutDataSchema = z.record(checkoutRecordSchema);

export const checkoutsSchema = z.record(checkoutDataSchema);

export type CheckoutRecord = z.infer<typeof checkoutRecordSchema>;
export type CheckoutData = z.infer<typeof checkoutDataSchema>;
export type Checkouts = z.infer<typeof checkoutsSchema>;

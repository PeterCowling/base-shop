import { z } from "zod";

export const ccDetailsSchema = z.object({
  ccNum: z.string(),
  expDate: z.string(),
});

export const bookingCCDataSchema = z.record(ccDetailsSchema);

export const ccDataSchema = z.record(bookingCCDataSchema);

export type CCDetails = z.infer<typeof ccDetailsSchema>;
export type BookingCCData = z.infer<typeof bookingCCDataSchema>;
export type CCData = z.infer<typeof ccDataSchema>;

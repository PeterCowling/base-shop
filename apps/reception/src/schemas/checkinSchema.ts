import { z } from "zod";

export const checkinRecordSchema = z.object({
  reservationCode: z.string().optional(),
  timestamp: z.string().optional(),
});

export const checkinDataSchema = z.record(checkinRecordSchema);

export const checkinsSchema = z.record(checkinDataSchema);

export type CheckinRecord = z.infer<typeof checkinRecordSchema>;
export type CheckinData = z.infer<typeof checkinDataSchema>;
export type Checkins = z.infer<typeof checkinsSchema>;

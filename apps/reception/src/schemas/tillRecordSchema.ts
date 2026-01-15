import { z } from "zod";

export const tillRecordSchema = z
  .object({
    amount: z.number().optional(),
    date: z.string().optional(),
    note: z.string().optional(),
  })
  .strict();

export const tillRecordMapSchema = z.record(tillRecordSchema);

export type TillRecord = z.infer<typeof tillRecordSchema>;
export type TillRecordMap = z.infer<typeof tillRecordMapSchema>;

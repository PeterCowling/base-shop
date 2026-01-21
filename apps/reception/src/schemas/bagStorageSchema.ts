import { z } from "zod";

export const bagStorageRecordSchema = z.object({
  optedIn: z.boolean(),
});

export const bagStorageSchema = z.record(bagStorageRecordSchema);

export type BagStorageRecord = z.infer<typeof bagStorageRecordSchema>;
export type BagStorage = z.infer<typeof bagStorageSchema>;

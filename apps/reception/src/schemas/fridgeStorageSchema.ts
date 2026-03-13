import { z } from "zod";

export const fridgeStorageRecordSchema = z.object({
  used: z.boolean(),
});

export const fridgeStorageSchema = z.record(fridgeStorageRecordSchema);

export type FridgeStorageRecord = z.infer<typeof fridgeStorageRecordSchema>;
export type FridgeStorage = z.infer<typeof fridgeStorageSchema>;

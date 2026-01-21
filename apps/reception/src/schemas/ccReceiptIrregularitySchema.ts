import { z } from "zod";

export const ccReceiptIrregularitySchema = z.object({
  user: z.string(),
  timestamp: z.string(),
  action: z.union([z.literal("reconcile"), z.literal("close")]),
  missingCount: z.number(),
});

export const ccReceiptIrregularitiesSchema = z.record(
  ccReceiptIrregularitySchema
);

export type CCReceiptIrregularity = z.infer<typeof ccReceiptIrregularitySchema>;
export type CCReceiptIrregularities = z.infer<
  typeof ccReceiptIrregularitiesSchema
>;

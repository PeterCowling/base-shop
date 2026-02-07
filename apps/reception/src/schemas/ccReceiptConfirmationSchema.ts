import { z } from "zod";

export const ccReceiptConfirmationSchema = z.object({
  user: z.string(),
  timestamp: z.string(),
});

export const ccReceiptConfirmationsSchema = z.record(
  ccReceiptConfirmationSchema
);

export type CCReceiptConfirmation = z.infer<typeof ccReceiptConfirmationSchema>;
export type CCReceiptConfirmations = z.infer<
  typeof ccReceiptConfirmationsSchema
>;

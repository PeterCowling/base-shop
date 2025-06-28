import { z } from "zod";

export const rentalOrderSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  shop: z.string(),
  deposit: z.number(),
  expectedReturnDate: z.string().optional(),
  startedAt: z.string(),
  returnedAt: z.string().optional(),
  refundedAt: z.string().optional(),
  /** Optional damage fee deducted from the deposit */
  damageFee: z.number().optional(),
});

export type RentalOrder = z.infer<typeof rentalOrderSchema>;

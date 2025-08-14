import { z } from "zod";

export const rentalOrderSchema = z
  .object({
    id: z.string(),
    sessionId: z.string(),
    shop: z.string(),
    deposit: z.number(),
    expectedReturnDate: z.string().optional(),
    /** Date by which the item must be returned */
    returnDueDate: z.string().optional(),
    startedAt: z.string(),
    returnedAt: z.string().optional(),
    /** Timestamp when the returned item was received at the warehouse */
    returnReceivedAt: z.string().optional(),
    refundedAt: z.string().optional(),
    /** Optional damage fee deducted from the deposit */
    damageFee: z.number().optional(),
    /** Amount charged as a late fee (in minor units) */
    lateFeeCharged: z.number().optional(),
    customerId: z.string().optional(),
    riskLevel: z.string().optional(),
    riskScore: z.number().optional(),
    flaggedForReview: z.boolean().optional(),
    trackingNumber: z.string().optional(),
    labelUrl: z.string().url().optional(),
  })
  .strict();

export type RentalOrder = z.infer<typeof rentalOrderSchema>;

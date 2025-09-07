import { z } from "zod";

export const rentalOrderSchema = z
  .object({
    id: z.string(),
    sessionId: z.string(),
    shop: z.string(),
    deposit: z.number(),
    expectedReturnDate: z.string().optional(),
    returnDueDate: z.string().optional(),
    startedAt: z.string(),
    returnedAt: z.string().optional(),
    returnReceivedAt: z.string().optional(),
    refundedAt: z.string().optional(),
    refundTotal: z.number().optional(),
    /** Optional damage fee deducted from the deposit */
    damageFee: z.number().optional(),
    lateFeeCharged: z.number().optional(),
    fulfilledAt: z.string().optional(),
    shippedAt: z.string().optional(),
    deliveredAt: z.string().optional(),
    cancelledAt: z.string().optional(),
    customerId: z.string().optional(),
    riskLevel: z.string().optional(),
    riskScore: z.number().optional(),
    flaggedForReview: z.boolean().optional(),
    trackingNumber: z.string().optional(),
    labelUrl: z.string().url().optional(),
    returnStatus: z.string().optional(),
    status: z
      .enum(["received", "cleaning", "repair", "qa", "available"])
      .optional(),
  })
  .strict();

export type RentalOrder = z.infer<typeof rentalOrderSchema>;

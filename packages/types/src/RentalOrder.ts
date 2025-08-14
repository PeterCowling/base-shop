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
    cleanedAt: z.string().optional(),
    repairedAt: z.string().optional(),
    qaAt: z.string().optional(),
    availableAt: z.string().optional(),
    refundedAt: z.string().optional(),
    /** Optional damage fee deducted from the deposit */
    damageFee: z.number().optional(),
    lateFeeCharged: z.number().optional(),
    customerId: z.string().optional(),
    riskLevel: z.string().optional(),
    riskScore: z.number().optional(),
    flaggedForReview: z.boolean().optional(),
    trackingNumber: z.string().optional(),
    labelUrl: z.string().url().optional(),
    status: z
      .enum(["received", "cleaning", "repair", "qa", "available"])
      .optional(),
  })
  .strict();

export type RentalOrder = z.infer<typeof rentalOrderSchema>;

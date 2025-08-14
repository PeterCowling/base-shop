import { z } from "zod";

export const rentalOrderSchema = z
  .object({
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
    customerId: z.string().optional(),
    riskLevel: z.string().optional(),
    riskScore: z.number().optional(),
    flaggedForReview: z.boolean().optional(),
    trackingNumber: z.string().optional(),
    labelUrl: z.string().url().optional(),
    trackingEvents: z
      .array(
        z
          .object({
            label: z.string(),
            date: z.string().optional(),
            complete: z.boolean().optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

export type RentalOrder = z.infer<typeof rentalOrderSchema>;

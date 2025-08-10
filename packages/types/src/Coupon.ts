import { z } from "zod";

/**
 * Represents a promotional coupon that may discount an order.
 * Either `percentOff` or `amountOff` may be provided.
 */
export const couponSchema = z.object({
  code: z.string(),
  percentOff: z.number().min(0).max(100).optional(),
  amountOff: z.number().nonnegative().optional(),
  expiresAt: z.string().optional(),
});

export type Coupon = z.infer<typeof couponSchema>;

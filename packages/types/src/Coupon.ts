import { z } from "zod";

/** Basic coupon definition */
export const couponSchema = z.object({
  /** Case-insensitive coupon code */
  code: z.string(),
  /** Optional description shown in CMS */
  description: z.string().optional(),
  /** Percentage discount to apply (0–100) */
  discountPercent: z.number().int().min(0).max(100),
  /** ISO date when the coupon becomes valid */
  validFrom: z.string().optional(),
  /** ISO date when the coupon expires */
  validTo: z.string().optional(),
});

export type Coupon = z.infer<typeof couponSchema>;

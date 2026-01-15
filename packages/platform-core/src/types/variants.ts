import { z } from "zod";

export const variantPricingSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    size: z.string().min(1),
    color: z.string().min(1),
    price: z.number().int().nonnegative(),
    currency: z.string().min(1),
    stripePriceId: z.string().min(1),
  })
  .strict();

export type VariantPricing = z.infer<typeof variantPricingSchema>;

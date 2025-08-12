import { z } from "zod";

export const discountSchema = z.object({
  code: z.string(),
  description: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100),
  active: z.boolean().default(true),
});

export type Discount = z.infer<typeof discountSchema>;

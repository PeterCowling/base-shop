// src/types/sku.ts
import { z } from "zod";

/** Runtime validator + compile-time source of truth */
export const skuSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  /** Unit price in minor currency units (e.g. cents) */
  price: z.number(),
  /** Refundable deposit, required by business rules */
  deposit: z.number(), // 👈  add the missing field
  image: z.string(),
  sizes: z.array(z.string()),
  description: z.string(),
});

export type SKU = z.infer<typeof skuSchema>;

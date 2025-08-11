import { z } from "zod";
import { skuSchema } from "@acme/types";

export const postSchema = z
  .object({
    sku: skuSchema.pick({ id: true }),
    qty: z.coerce.number().int().min(1).default(1),
    // Optional size for SKUs that require it. Ensure non-empty when provided.
    size: z.string().min(1).optional(),
  })
  .strict();

export const patchSchema = z
  .object({
    id: z.string(),
    qty: z.coerce.number().int().min(0),
  })
  .strict();

export const putSchema = z
  .object({
    lines: z.array(postSchema),
  })
  .strict();


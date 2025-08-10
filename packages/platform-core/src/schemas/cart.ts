import { z } from "zod";
import { skuSchema } from "@types";

export const postSchema = z
  .object({
    sku: z.union([skuSchema, skuSchema.pick({ id: true })]),
    qty: z.coerce.number().int().min(1).default(1),
  })
  .strict();

export const patchSchema = z
  .object({
    id: z.string(),
    qty: z.coerce.number().int().min(1),
  })
  .strict();


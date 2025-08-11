import { z } from "zod";
import { skuSchema } from "@types";

export const postSchema = z
  .object({
    sku: z.union([skuSchema, skuSchema.pick({ id: true })]),
    qty: z.coerce.number().int().min(1).default(1),
    size: z.string().optional(),
  })
  .strict()
  .refine(
    (d) => {
      if ("sizes" in d.sku && Array.isArray(d.sku.sizes) && d.sku.sizes.length) {
        return typeof d.size === "string" && d.size.length > 0;
      }
      return true;
    },
    { path: ["size"], message: "Size is required" }
  );

export const patchSchema = z
  .object({
    id: z.string(),
    qty: z.coerce.number().int().min(0),
  })
  .strict();


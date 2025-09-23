import { z } from "zod";

export const postSchema = z
  .object({
    sku: z.object({ id: z.string() }),
    qty: z.coerce.number().int().min(1).default(1),
    // Optional size for SKUs that require it. Ensure non-empty when provided.
    size: z.string().min(1).optional(),
    // Optional rental payload carried through the cart
    rental: z
      .object({
        sku: z.string(),
        start: z.string(),
        end: z.string(),
        durationUnit: z.enum(["hour", "day", "week"]),
        locationId: z.string().optional(),
        deposit: z.coerce.number().optional(),
        insurance: z.object({ selected: z.boolean(), fee: z.coerce.number().optional() }).optional(),
        termsVersion: z.string(),
      })
      .partial({ sku: true })
      .optional(),
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

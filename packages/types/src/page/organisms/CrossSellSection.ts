import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CrossSellSectionComponent extends PageComponentBase {
  type: "CrossSellSection";
  rules?: { seedId?: string; includeForRental?: boolean; onlyInStock?: boolean; maxItems?: number };
  layout?: "grid" | "carousel";
}

export const crossSellSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("CrossSellSection"),
  rules: z
    .object({
      seedId: z.string().optional(),
      includeForRental: z.boolean().optional(),
      onlyInStock: z.boolean().optional(),
      maxItems: z.number().int().positive().max(24).optional(),
    })
    .optional(),
  layout: z.enum(["grid", "carousel"]).optional(),
});


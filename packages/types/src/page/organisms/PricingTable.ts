import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface PricingTableComponent extends PageComponentBase {
  type: "PricingTable";
  plans?: {
    title: string;
    price: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    featured?: boolean;
  }[];
}

export const pricingTableComponentSchema = baseComponentSchema.extend({
  type: z.literal("PricingTable"),
  plans: z
    .array(
      z.object({
        title: z.string(),
        price: z.string(),
        features: z.array(z.string()),
        ctaLabel: z.string(),
        ctaHref: z.string(),
        featured: z.boolean().optional(),
      })
    )
    .optional(),
});


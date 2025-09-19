import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import { skuSchema } from "../../Product";

const featuredProductSchema = skuSchema.extend({
  badges: z
    .object({
      sale: z.boolean().optional(),
      new: z.boolean().optional(),
    })
    .strict()
    .optional(),
});

export type FeaturedProduct = z.infer<typeof featuredProductSchema>;

export interface FeaturedProductComponent extends PageComponentBase {
  type: "FeaturedProduct";
  sku?: FeaturedProduct;
  collectionId?: string;
}

export const featuredProductComponentSchema = baseComponentSchema.extend({
  type: z.literal("FeaturedProduct"),
  sku: featuredProductSchema.optional(),
  collectionId: z.string().optional(),
});


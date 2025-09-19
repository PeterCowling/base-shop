import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import { skuSchema, type SKU } from "../../Product";

const skuAttributeSchema = skuSchema.keyof();

export interface ProductComparisonComponent extends PageComponentBase {
  type: "ProductComparison";
  skus?: SKU[];
  attributes?: Array<keyof SKU>;
}

export const productComparisonComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductComparison"),
  skus: z.array(skuSchema).optional(),
  attributes: z.array(skuAttributeSchema).optional(),
});


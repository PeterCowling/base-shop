import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import { skuSchema, type SKU } from "../../Product";

export interface ProductBundleComponent extends PageComponentBase {
  type: "ProductBundle";
  skus?: SKU[];
  /** Percentage discount applied to the combined price */
  discount?: number;
  /** Quantity of bundles */
  quantity?: number;
}

export const productBundleComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductBundle"),
  skus: z.array(skuSchema).optional(),
  discount: z.number().min(0).max(100).optional(),
  quantity: z.number().int().min(1).optional(),
});


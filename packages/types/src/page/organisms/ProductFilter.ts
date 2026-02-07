import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ProductFilterComponent extends PageComponentBase {
  type: "ProductFilter";
  showSize?: boolean;
  showColor?: boolean;
  showPrice?: boolean;
}

export const productFilterComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductFilter"),
  showSize: z.boolean().optional(),
  showColor: z.boolean().optional(),
  showPrice: z.boolean().optional(),
});


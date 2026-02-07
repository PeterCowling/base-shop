import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ProductGridComponent extends PageComponentBase {
  type: "ProductGrid";
  skus?: string[];
  collectionId?: string;
  mode?: "collection" | "manual";
  /** Enable product quick view modal */
  quickView?: boolean;
}

export const productGridComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductGrid"),
});


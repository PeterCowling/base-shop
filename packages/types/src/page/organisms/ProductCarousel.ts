import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ProductCarouselComponent extends PageComponentBase {
  type: "ProductCarousel";
  skus?: string[];
  collectionId?: string;
  mode?: "collection" | "manual";
  /** Enable product quick view modal */
  quickView?: boolean;
}

export const productCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductCarousel"),
});


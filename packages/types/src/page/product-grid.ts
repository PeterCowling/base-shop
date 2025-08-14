import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

/** Grid of products; `minItems`/`maxItems` clamp the responsive product count */
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

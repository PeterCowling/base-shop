import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface StickyBuyBarComponent extends PageComponentBase {
  type: "StickyBuyBar";
  // Product is provided by runtime binding; schema holds no product object
}

export const stickyBuyBarComponentSchema = baseComponentSchema.extend({
  type: z.literal("StickyBuyBar"),
});


import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CartSectionComponent extends PageComponentBase {
  type: "CartSection";
  showPromo?: boolean;
  showGiftCard?: boolean;
  showLoyalty?: boolean;
}

export const cartSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("CartSection"),
  showPromo: z.boolean().optional(),
  showGiftCard: z.boolean().optional(),
  showLoyalty: z.boolean().optional(),
});


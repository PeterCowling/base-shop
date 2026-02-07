import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface HeaderCartComponent extends PageComponentBase {
  type: "HeaderCart";
  /**
   * Whether to show the textual cart label next to the icon.
   * Defaults to true.
   */
  showLabel?: boolean;
  /**
   * Whether to show the cart subtotal next to the icon.
   * Defaults to false.
   */
  showSubtotal?: boolean;
}

export const headerCartComponentSchema = baseComponentSchema.extend({
  type: z.literal("HeaderCart"),
  showLabel: z.boolean().optional(),
  showSubtotal: z.boolean().optional(),
});


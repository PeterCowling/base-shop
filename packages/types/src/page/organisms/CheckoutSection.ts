import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CheckoutSectionComponent extends PageComponentBase {
  type: "CheckoutSection";
  locale?: string;
  taxRegion?: string;
  showWallets?: boolean;
  showBNPL?: boolean;
}

export const checkoutSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("CheckoutSection"),
  locale: z.string().optional(),
  taxRegion: z.string().optional(),
  showWallets: z.boolean().optional(),
  showBNPL: z.boolean().optional(),
});


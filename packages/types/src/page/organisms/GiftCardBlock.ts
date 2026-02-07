import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface GiftCardBlockComponent extends PageComponentBase {
  type: "GiftCardBlock";
  denominations?: number[];
  description?: string;
}

export const giftCardBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("GiftCardBlock"),
  denominations: z.array(z.number()).optional(),
  description: z.string().optional(),
});


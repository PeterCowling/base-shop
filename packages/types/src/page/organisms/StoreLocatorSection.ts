import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface StoreLocatorSectionComponent extends PageComponentBase {
  type: "StoreLocatorSection";
  enableGeolocation?: boolean;
  radiusKm?: number;
  emitLocalBusiness?: boolean;
}

export const storeLocatorSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("StoreLocatorSection"),
  enableGeolocation: z.boolean().optional(),
  radiusKm: z.number().positive().optional(),
  emitLocalBusiness: z.boolean().optional(),
});


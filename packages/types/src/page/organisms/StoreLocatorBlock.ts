import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface StoreLocatorBlockComponent extends PageComponentBase {
  type: "StoreLocatorBlock";
  locations?: { lat?: number; lng?: number; label?: string }[];
  zoom?: number;
}

export const storeLocatorBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("StoreLocatorBlock"),
  locations: z
    .array(
      z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
        label: z.string().optional(),
      })
    )
    .optional(),
  zoom: z.number().optional(),
});


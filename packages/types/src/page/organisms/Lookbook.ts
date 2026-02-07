import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface LookbookComponent extends PageComponentBase {
  type: "Lookbook";
  src?: string;
  alt?: string;
  hotspots?: { sku?: string; x: number; y: number }[];
}

export const lookbookComponentSchema = baseComponentSchema.extend({
  type: z.literal("Lookbook"),
  src: z.string().optional(),
  alt: z.string().optional(),
  hotspots: z
    .array(
      z.object({
        sku: z.string().optional(),
        x: z.number(),
        y: z.number(),
      })
    )
    .optional(),
});


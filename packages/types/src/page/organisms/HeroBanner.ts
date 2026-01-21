import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface HeroBannerComponent extends PageComponentBase {
  type: "HeroBanner";
  slides?: { src: string; alt?: string; headlineKey: string; ctaKey: string }[];
}

export const heroBannerComponentSchema = baseComponentSchema.extend({
  type: z.literal("HeroBanner"),
  slides: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        headlineKey: z.string(),
        ctaKey: z.string(),
      })
    )
    .optional(),
});


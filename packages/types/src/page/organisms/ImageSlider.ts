import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ImageSliderComponent extends PageComponentBase {
  type: "ImageSlider";
  slides?: { src: string; alt?: string; caption?: string }[];
  minItems?: number;
  maxItems?: number;
  /** When enabled, clicking images opens a grouped lightbox */
  openInLightbox?: boolean;
}

export const imageSliderComponentSchema = baseComponentSchema.extend({
  type: z.literal("ImageSlider"),
  slides: z
    .array(
      z.object({ src: z.string(), alt: z.string().optional(), caption: z.string().optional() })
    )
    .optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  openInLightbox: z.boolean().optional(),
});

import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface GalleryComponent extends PageComponentBase {
  type: "Gallery";
  images?: { src: string; alt?: string }[];
  /** When enabled, clicking images opens a grouped lightbox */
  openInLightbox?: boolean;
}

export const galleryComponentSchema = baseComponentSchema.extend({
  type: z.literal("Gallery"),
  images: z
    .array(z.object({ src: z.string(), alt: z.string().optional() }))
    .optional(),
  openInLightbox: z.boolean().optional(),
});

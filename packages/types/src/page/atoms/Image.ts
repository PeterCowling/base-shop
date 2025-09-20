import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
  /** Aspect ratio preset like "1:1", "4:3", "16:9" */
  cropAspect?: string;
  /** Focal point within the image (0..1 coordinates) */
  focalPoint?: { x: number; y: number };
}

export const imageComponentSchema = baseComponentSchema.extend({
  type: z.literal("Image"),
  src: z.string().optional(),
  alt: z.string().optional(),
  cropAspect: z.string().optional(),
  focalPoint: z
    .object({ x: z.number(), y: z.number() })
    .optional(),
});

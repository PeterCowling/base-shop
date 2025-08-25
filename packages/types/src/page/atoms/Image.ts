import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
}

export const imageComponentSchema = baseComponentSchema.extend({
  type: z.literal("Image"),
  src: z.string().optional(),
  alt: z.string().optional(),
});

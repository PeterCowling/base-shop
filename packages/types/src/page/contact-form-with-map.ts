import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

export interface ContactFormWithMapComponent extends PageComponentBase {
  type: "ContactFormWithMap";
  mapSrc?: string;
}

export const contactFormWithMapComponentSchema = baseComponentSchema.extend({
  type: z.literal("ContactFormWithMap"),
  mapSrc: z.string().optional(),
});

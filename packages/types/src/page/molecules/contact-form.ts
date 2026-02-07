import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ContactFormComponent extends PageComponentBase {
  type: "ContactForm";
  action?: string;
  method?: string;
}

export const contactFormComponentSchema = baseComponentSchema.extend({
  type: z.literal("ContactForm"),
  action: z.string().optional(),
  method: z.string().optional(),
});


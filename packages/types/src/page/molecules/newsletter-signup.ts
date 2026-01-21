import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface NewsletterSignupComponent extends PageComponentBase {
  type: "NewsletterSignup";
  text?: string;
  action?: string;
  placeholder?: string;
  submitLabel?: string;
}

export const newsletterSignupComponentSchema = baseComponentSchema.extend({
  type: z.literal("NewsletterSignup"),
  text: z.string().optional(),
  action: z.string().optional(),
  placeholder: z.string().optional(),
  submitLabel: z.string().optional(),
});


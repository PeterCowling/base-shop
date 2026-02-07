import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface FAQBlockComponent extends PageComponentBase {
  type: "FAQBlock";
  items?: { question: string; answer: string }[];
}

export const faqBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("FAQBlock"),
  items: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});


import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface FooterComponent extends PageComponentBase {
  type: "Footer";
  links?: { label: string; url: string }[];
  logo?: string;
}

export const footerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Footer"),
  links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  logo: z.string().optional(),
});

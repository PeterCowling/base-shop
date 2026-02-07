import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface HeaderComponent extends PageComponentBase {
  type: "Header";
  nav?: { label: string; url: string }[];
  logo?: string;
}

export const headerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Header"),
  nav: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  logo: z.string().optional(),
});

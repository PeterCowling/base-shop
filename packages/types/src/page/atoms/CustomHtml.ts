import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CustomHtmlComponent extends PageComponentBase {
  type: "CustomHtml";
  html?: string;
}

export const customHtmlComponentSchema = baseComponentSchema.extend({
  type: z.literal("CustomHtml"),
  html: z.string().optional(),
});


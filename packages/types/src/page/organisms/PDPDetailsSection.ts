import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface PDPDetailsSectionComponent extends PageComponentBase {
  type: "PDPDetailsSection";
  preset?: "default" | "luxury";
}

export const pdpDetailsSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("PDPDetailsSection"),
  preset: z.enum(["default", "luxury"]).optional(),
});


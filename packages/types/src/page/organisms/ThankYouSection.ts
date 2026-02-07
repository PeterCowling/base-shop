import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ThankYouSectionComponent extends PageComponentBase {
  type: "ThankYouSection";
  headline?: string;
  message?: string;
  recommendationPreset?: "featured" | "new" | "bestsellers" | "clearance" | "limited";
}

export const thankYouSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("ThankYouSection"),
  headline: z.string().optional(),
  message: z.string().optional(),
  recommendationPreset: z.enum(["featured", "new", "bestsellers", "clearance", "limited"]).optional(),
});


import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export type GuidedQuestion = {
  id: string;
  label: string;
  type: "choice";
  options: Array<{ value: string; label: string }>;
};

export interface GuidedSellingSectionComponent extends PageComponentBase {
  type: "GuidedSellingSection";
  title?: string;
  questions?: GuidedQuestion[];
  outputMode?: "inline" | "link";
  collectionBasePath?: string; // used when outputMode = link
}

export const guidedSellingSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("GuidedSellingSection"),
  title: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.literal("choice"),
        options: z.array(z.object({ value: z.string(), label: z.string() })),
      })
    )
    .optional(),
  outputMode: z.enum(["inline", "link"]).optional(),
  collectionBasePath: z.string().optional(),
});


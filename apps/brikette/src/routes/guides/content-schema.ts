import { z } from "zod";

const guideSeoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .partial();

export const guideContentSchema = z
  .object({
    seo: guideSeoSchema.optional(),
    linkLabel: z.string().trim().min(1).optional(),
    intro: z.union([z.string(), z.array(z.unknown()), z.record(z.unknown())]).optional(),
    sections: z.array(z.unknown()).optional(),
    faqs: z.array(z.unknown()).optional(),
    tips: z.array(z.unknown()).optional(),
    warnings: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type GuideContentInput = z.infer<typeof guideContentSchema>;

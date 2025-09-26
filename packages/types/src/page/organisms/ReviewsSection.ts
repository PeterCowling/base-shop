import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ReviewsSectionComponent extends PageComponentBase {
  type: "ReviewsSection";
  provider?: "custom" | "yotpo" | "okendo";
  productId?: string;
  minRating?: number;
  showAggregate?: boolean;
  emitJsonLd?: boolean;
  items?: Array<{ id: string; author?: string; rating?: number; title?: string; body?: string; createdAt?: string }>;
}

export const reviewsSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("ReviewsSection"),
  provider: z.enum(["custom", "yotpo", "okendo"]).optional(),
  productId: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  showAggregate: z.boolean().optional(),
  emitJsonLd: z.boolean().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        author: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        title: z.string().optional(),
        body: z.string().optional(),
        createdAt: z.string().optional(),
      })
    )
    .optional(),
});


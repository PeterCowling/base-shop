import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
  reviews?: { nameKey: string; quoteKey: string }[];
}

export const reviewsCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ReviewsCarousel"),
  reviews: z
    .array(z.object({ nameKey: z.string(), quoteKey: z.string() }))
    .optional(),
});


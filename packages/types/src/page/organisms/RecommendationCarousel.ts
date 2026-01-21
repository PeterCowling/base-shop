import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface RecommendationCarouselComponent extends PageComponentBase {
  type: "RecommendationCarousel";
  endpoint: string;
}

export const recommendationCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("RecommendationCarousel"),
  endpoint: z.string(),
});


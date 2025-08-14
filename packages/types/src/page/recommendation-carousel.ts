import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

/** Carousel of recommended products fetched from an API. `minItems`/`maxItems` limit visible products */
export interface RecommendationCarouselComponent extends PageComponentBase {
  type: "RecommendationCarousel";
  endpoint: string;
}

export const recommendationCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("RecommendationCarousel"),
  endpoint: z.string(),
});

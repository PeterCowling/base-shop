import {
  RecommendationCarousel as BaseCarousel,
  type RecommendationCarouselProps,
} from "../../organisms/RecommendationCarousel";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

export default function CmsRecommendationCarousel({
  minItems,
  maxItems,
  ...rest
}: RecommendationCarouselProps) {
  return (
    <BaseCarousel minItems={minItems} maxItems={maxItems} {...rest} />
  );
}

export function getRuntimeProps() {
  return { endpoint: "/api", products: PRODUCTS as SKU[] };
}

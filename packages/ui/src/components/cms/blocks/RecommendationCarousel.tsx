import {
  RecommendationCarousel as BaseCarousel,
  type RecommendationCarouselProps,
} from "../../organisms/RecommendationCarousel";

export default function CmsRecommendationCarousel({
  minItems,
  maxItems,
  ...rest
}: RecommendationCarouselProps) {
  return (
    <BaseCarousel minItems={minItems} maxItems={maxItems} {...rest} />
  );
}

import {
  RecommendationCarousel as BaseCarousel,
  type RecommendationCarouselProps,
} from "../../organisms/RecommendationCarousel";

export default function CmsRecommendationCarousel({
  minItems,
  maxItems,
  desktopItems,
  tabletItems,
  mobileItems,
  ...rest
}: RecommendationCarouselProps) {
  return (
    <BaseCarousel
      minItems={minItems}
      maxItems={maxItems}
      desktopItems={desktopItems}
      tabletItems={tabletItems}
      mobileItems={mobileItems}
      {...rest}
    />
  );
}

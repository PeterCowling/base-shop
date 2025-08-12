import {
  ProductCarousel as BaseCarousel,
  type ProductCarouselProps,
} from "../../organisms/ProductCarousel";

export default function CmsProductCarousel({
  minItems,
  maxItems,
  desktopItems,
  tabletItems,
  mobileItems,
  ...rest
}: ProductCarouselProps) {
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

import {
  ProductCarousel as BaseCarousel,
  type ProductCarouselProps,
} from "../../organisms/ProductCarousel";

export default function CmsProductCarousel({
  minItems,
  maxItems,
  ...rest
}: ProductCarouselProps) {
  return (
    <BaseCarousel minItems={minItems} maxItems={maxItems} {...rest} />
  );
}

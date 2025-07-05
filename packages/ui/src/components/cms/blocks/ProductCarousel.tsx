import {
  ProductCarousel as BaseCarousel,
  type ProductCarouselProps,
} from "../../organisms/ProductCarousel";

export default function CmsProductCarousel(props: ProductCarouselProps) {
  return <BaseCarousel {...props} />;
}

import {
  RecommendationCarousel as BaseCarousel,
  type RecommendationCarouselProps,
} from "../../organisms/RecommendationCarousel";
import { PRODUCTS } from "@platform-core/src/products";
import { Product } from "../../organisms/ProductCard";

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
  const products: Product[] = PRODUCTS.map(({ id, title, image, price }) => ({
    id,
    title,
    image,
    price,
  }));
  return { endpoint: "/api", products };
}

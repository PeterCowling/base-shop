import HeroBanner from "./HeroBanner";
import ProductGrid from "./ProductGrid";
import ReviewsCarousel from "./ReviewsCarousel";
import ValueProps from "./ValueProps";

export { HeroBanner, ProductGrid, ReviewsCarousel, ValueProps };

export const blockRegistry = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
} as const;

export type BlockType = keyof typeof blockRegistry;

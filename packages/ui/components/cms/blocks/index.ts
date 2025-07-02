import ContactForm from "./ContactForm";
import Gallery from "./Gallery";
import HeroBanner from "./HeroBanner";
import ProductGrid from "./ProductGrid";
import ReviewsCarousel from "./ReviewsCarousel";
import Testimonials from "./Testimonials";
import ValueProps from "./ValueProps";

export {
  ContactForm,
  Gallery,
  HeroBanner,
  ProductGrid,
  ReviewsCarousel,
  Testimonials,
  ValueProps,
};

export const blockRegistry = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
  Gallery,
  ContactForm,
  Testimonials,
} as const;

export type BlockType = keyof typeof blockRegistry;

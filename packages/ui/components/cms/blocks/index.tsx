import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import HeroBanner from "./HeroBanner";
import ProductGrid from "./ProductGrid";
import ReviewsCarousel from "./ReviewsCarousel";
import TestimonialSlider from "./TestimonialSlider";
import Testimonials from "./Testimonials";
import ValueProps from "./ValueProps";

export {
  BlogListing,
  ContactForm,
  ContactFormWithMap,
  Gallery,
  HeroBanner,
  ProductGrid,
  ReviewsCarousel,
  Testimonials,
  TestimonialSlider,
  ValueProps,
};

export * from "./atoms";
export * from "./molecules";
export * from "./organisms";

import { atomRegistry } from "./atoms";
import { moleculeRegistry } from "./molecules";
import { organismRegistry } from "./organisms";

// Re-export individual registries so consumers can access them directly.
export { atomRegistry, moleculeRegistry, organismRegistry };

export const blockRegistry = {
  ...atomRegistry,
  ...moleculeRegistry,
  ...organismRegistry,
} as const;

export type BlockType = keyof typeof blockRegistry;

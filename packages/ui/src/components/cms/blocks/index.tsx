import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import HeroBanner from "./HeroBanner";
import ProductCarousel from "./ProductCarousel";
import ProductGrid from "./ProductGrid.client";
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
  ProductCarousel,
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
import { containerRegistry } from "./containers";

// Re-export individual registries so consumers can access them directly.
export { atomRegistry, moleculeRegistry, organismRegistry, containerRegistry };

export const blockRegistry = {
  ...containerRegistry,
  ...atomRegistry,
  ...moleculeRegistry,
  ...organismRegistry,
} as const;

export type BlockType = keyof typeof blockRegistry;

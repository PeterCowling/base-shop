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

export const organismRegistry = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
  Gallery,
  ContactForm,
  ContactFormWithMap,
  BlogListing,
  Testimonials,
  TestimonialSlider,
} as const;

export type OrganismBlockType = keyof typeof organismRegistry;

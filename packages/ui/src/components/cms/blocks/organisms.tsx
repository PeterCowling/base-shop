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
import RecommendationCarousel from "./RecommendationCarousel";
import AnnouncementBar from "./AnnouncementBarBlock";
import MapBlock from "./MapBlock";
import VideoBlock from "./VideoBlock";
import FAQBlock from "./FAQBlock";

export const organismRegistry = {
  AnnouncementBar,
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
  ProductCarousel,
  RecommendationCarousel,
  Gallery,
  ContactForm,
  ContactFormWithMap,
  BlogListing,
  Testimonials,
  TestimonialSlider,
  MapBlock,
  VideoBlock,
  FAQBlock,
} as const;

export type OrganismBlockType = keyof typeof organismRegistry;

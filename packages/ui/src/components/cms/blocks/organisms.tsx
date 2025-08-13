import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import HeroBanner from "./HeroBanner";
import ProductCarousel, {
  getRuntimeProps as getProductCarouselRuntimeProps,
} from "./ProductCarousel";
import ProductGrid, {
  getRuntimeProps as getProductGridRuntimeProps,
} from "./ProductGrid.client";
import ReviewsCarousel from "./ReviewsCarousel";
import TestimonialSlider from "./TestimonialSlider";
import Testimonials from "./Testimonials";
import ValueProps from "./ValueProps";
import RecommendationCarousel, {
  getRuntimeProps as getRecommendationCarouselRuntimeProps,
} from "./RecommendationCarousel";
import FeaturedProductBlock, {
  getRuntimeProps as getFeaturedProductRuntimeProps,
} from "./FeaturedProductBlock";
import AnnouncementBar from "./AnnouncementBarBlock";
import MapBlock from "./MapBlock";
import StoreLocatorBlock from "./StoreLocatorBlock";
import VideoBlock from "./VideoBlock";
import FAQBlock from "./FAQBlock";
import CountdownTimer from "./CountdownTimer";
import SocialLinks from "./SocialLinks";
import SocialFeed from "./SocialFeed";
import PricingTable from "./PricingTable";
import NewsletterSignup from "./NewsletterSignup";
import Tabs from "./Tabs";
import ImageSlider from "./ImageSlider";
import CollectionList from "./CollectionList";
import SearchBar from "./SearchBar";
import ProductComparisonBlock from "./ProductComparisonBlock";
import BookingCalendar from "./BookingCalendar";

export const organismRegistry = {
  AnnouncementBar: { component: AnnouncementBar },
  HeroBanner: { component: HeroBanner },
  ValueProps: { component: ValueProps },
  ReviewsCarousel: { component: ReviewsCarousel },
  ProductGrid: {
    component: ProductGrid,
    getRuntimeProps: getProductGridRuntimeProps,
  },
  ProductCarousel: {
    component: ProductCarousel,
    getRuntimeProps: getProductCarouselRuntimeProps,
  },
  RecommendationCarousel: {
    component: RecommendationCarousel,
    getRuntimeProps: getRecommendationCarouselRuntimeProps,
  },
  FeaturedProduct: {
    component: FeaturedProductBlock,
    getRuntimeProps: getFeaturedProductRuntimeProps,
  },
  ImageSlider: { component: ImageSlider },
  CollectionList: { component: CollectionList },
  Gallery: { component: Gallery },
  ContactForm: { component: ContactForm },
  ContactFormWithMap: { component: ContactFormWithMap },
  BlogListing: { component: BlogListing },
  Testimonials: { component: Testimonials },
  TestimonialSlider: { component: TestimonialSlider },
  MapBlock: { component: MapBlock },
  StoreLocatorBlock: { component: StoreLocatorBlock },
  VideoBlock: { component: VideoBlock },
  FAQBlock: { component: FAQBlock },
  CountdownTimer: { component: CountdownTimer },
  SocialLinks: { component: SocialLinks },
  SocialFeed: { component: SocialFeed },
  NewsletterSignup: { component: NewsletterSignup },
  SearchBar: { component: SearchBar },
  PricingTable: { component: PricingTable },
  Tabs: { component: Tabs },
  ProductComparison: { component: ProductComparisonBlock },
  BookingCalendar: { component: BookingCalendar },
} as const;

export type OrganismBlockType = keyof typeof organismRegistry;

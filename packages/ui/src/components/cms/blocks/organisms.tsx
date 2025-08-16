import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import Lookbook from "./Lookbook";
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
import SocialProof from "./SocialProof";
import PricingTable from "./PricingTable";
import NewsletterSignup from "./NewsletterSignup";
import Tabs from "./Tabs";
import ImageSlider from "./ImageSlider";
import CollectionList from "./CollectionList";
import SearchBar from "./SearchBar";
import ProductComparisonBlock from "./ProductComparisonBlock";
import GiftCardBlock from "./GiftCardBlock";
import FormBuilderBlock from "./FormBuilderBlock";
import PopupModal from "./PopupModal";
import ProductBundle, {
  getRuntimeProps as getProductBundleRuntimeProps,
} from "./ProductBundle";
import ProductFilter from "./ProductFilter";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const organismEntries = {
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
  Lookbook: { component: Lookbook },
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
  SocialProof: { component: SocialProof },
  NewsletterSignup: { component: NewsletterSignup },
  SearchBar: { component: SearchBar },
  PricingTable: { component: PricingTable },
  Tabs: { component: Tabs },
  ProductComparison: { component: ProductComparisonBlock },
  GiftCardBlock: { component: GiftCardBlock },
  FormBuilderBlock: { component: FormBuilderBlock },
  PopupModal: { component: PopupModal },
  ProductBundle: {
    component: ProductBundle,
    getRuntimeProps: getProductBundleRuntimeProps,
  },
  ProductFilter: { component: ProductFilter },
} as const;

type OrganismRegistry = {
  [K in keyof typeof organismEntries]: BlockRegistryEntry<any>;
};

export const organismRegistry = Object.fromEntries(
  Object.entries(organismEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as OrganismRegistry;

export type OrganismBlockType = keyof typeof organismEntries;

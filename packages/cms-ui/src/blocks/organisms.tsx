import AccountSection from "./AccountSection";
import AgeGateSection from "./AgeGateSection";
import AnalyticsPixelsSection from "./AnalyticsPixelsSection";
import AnnouncementBar from "./AnnouncementBarBlock";
import BlogListing from "./BlogListing";
import CampaignHeroSection from "./CampaignHeroSection";
import CartSection from "./CartSection";
import CertificateCheck from "./CertificateCheck";
import CheckoutSection from "./CheckoutSection";
import CollectionList from "./CollectionList";
import ConsentSection from "./ConsentSection";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import CountdownTimer from "./CountdownTimer";
import CrossSellSection from "./CrossSellSection";
import CurrencySelector from "./CurrencySelector";
import DSARSection from "./DSARSection";
import EmailReferralSection from "./EmailReferralSection";
import FAQBlock from "./FAQBlock";
import FeaturedProductBlock, {
  getRuntimeProps as getFeaturedProductRuntimeProps,
} from "./FeaturedProductBlock";
import FinancingBadge from "./FinancingBadge";
import FooterSection from "./FooterSection";
import FormBuilderBlock from "./FormBuilderBlock";
import Gallery from "./Gallery";
import GiftCardBlock from "./GiftCardBlock";
import GuidedSellingSection from "./GuidedSellingSection";
import HeaderCart from "./HeaderCart";
import HeaderSection from "./HeaderSection";
import HeroBanner from "./HeroBanner";
import ImageSlider from "./ImageSlider";
import Lookbook from "./Lookbook";
import MapBlock from "./MapBlock";
import NewsletterSignup from "./NewsletterSignup";
import PDPDetailsSection from "./PDPDetailsSection";
import PoliciesAccordion from "./PoliciesAccordion";
import PopupModal from "./PopupModal";
import PricingTable from "./PricingTable";
import ProductBundle, {
  getRuntimeProps as getProductBundleRuntimeProps,
} from "./ProductBundle";
import ProductCarousel, {
  getRuntimeProps as getProductCarouselRuntimeProps,
} from "./ProductCarousel";
import ProductComparisonBlock from "./ProductComparisonBlock";
import ProductFilter from "./ProductFilter";
import ProductGrid, {
  getRuntimeProps as getProductGridRuntimeProps,
} from "./ProductGrid.client";
import PromoTilesSection from "./PromoTilesSection";
import RecommendationCarousel, {
  getRuntimeProps as getRecommendationCarouselRuntimeProps,
} from "./RecommendationCarousel";
import RentalAvailabilitySection from "./RentalAvailabilitySection";
import RentalManageSection from "./RentalManageSection";
import RentalTermsSection from "./RentalTermsSection";
import ReviewsCarousel from "./ReviewsCarousel";
import ReviewsSection from "./ReviewsSection";
import SearchBar from "./SearchBar";
import ShowcaseSection from "./ShowcaseSection";
import SocialFeed from "./SocialFeed";
import SocialLinks from "./SocialLinks";
import SocialProof from "./SocialProof";
import StickyBuyBar from "./StickyBuyBar";
import StoreLocatorBlock from "./StoreLocatorBlock";
import StoreLocatorSection from "./StoreLocatorSection";
import StructuredDataSection from "./StructuredDataSection";
import Tabs from "./Tabs";
import Testimonials from "./Testimonials";
import TestimonialSlider from "./TestimonialSlider";
import ThankYouSection from "./ThankYouSection";
import type { BlockRegistryEntry } from "./types";
import ValueProps from "./ValueProps";
import VideoBlock from "./VideoBlock";

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
  HeaderCart: { component: HeaderCart },
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
  HeaderSection: { component: HeaderSection },
  FooterSection: { component: FooterSection },
  CurrencySelector: { component: CurrencySelector },
  CampaignHeroSection: { component: CampaignHeroSection },
  PromoTilesSection: { component: PromoTilesSection },
  ShowcaseSection: { component: ShowcaseSection },
  CrossSellSection: { component: CrossSellSection },
  FinancingBadge: { component: FinancingBadge },
  CertificateCheck: { component: CertificateCheck },
  PoliciesAccordion: { component: PoliciesAccordion },
  StickyBuyBar: { component: StickyBuyBar },
  PDPDetailsSection: { component: PDPDetailsSection },
  GuidedSellingSection: { component: GuidedSellingSection },
  CartSection: { component: CartSection },
  CheckoutSection: { component: CheckoutSection },
  ThankYouSection: { component: ThankYouSection },
  StoreLocatorSection: { component: StoreLocatorSection },
  EmailReferralSection: { component: EmailReferralSection },
  DSARSection: { component: DSARSection },
  AgeGateSection: { component: AgeGateSection },
  AccountSection: { component: AccountSection },
  RentalManageSection: { component: RentalManageSection },
  RentalAvailabilitySection: { component: RentalAvailabilitySection },
  RentalTermsSection: { component: RentalTermsSection },
  StructuredDataSection: { component: StructuredDataSection },
  ConsentSection: { component: ConsentSection },
  AnalyticsPixelsSection: { component: AnalyticsPixelsSection },
  ReviewsSection: { component: ReviewsSection },
} as const;

type OrganismRegistry = {
  [K in keyof typeof organismEntries]: BlockRegistryEntry<unknown>;
};

export const organismRegistry = Object.fromEntries(
  Object.entries(organismEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as OrganismRegistry;

export type OrganismBlockType = keyof typeof organismEntries;

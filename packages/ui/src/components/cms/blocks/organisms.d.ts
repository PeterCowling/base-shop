import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import Lookbook from "./Lookbook";
import HeroBanner from "./HeroBanner";
import ProductCarousel, { getRuntimeProps as getProductCarouselRuntimeProps } from "./ProductCarousel";
import ProductGrid, { getRuntimeProps as getProductGridRuntimeProps } from "./ProductGrid.client";
import ReviewsCarousel from "./ReviewsCarousel";
import TestimonialSlider from "./TestimonialSlider";
import Testimonials from "./Testimonials";
import ValueProps from "./ValueProps";
import RecommendationCarousel, { getRuntimeProps as getRecommendationCarouselRuntimeProps } from "./RecommendationCarousel";
import FeaturedProductBlock, { getRuntimeProps as getFeaturedProductRuntimeProps } from "./FeaturedProductBlock";
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
import ProductBundle, { getRuntimeProps as getProductBundleRuntimeProps } from "./ProductBundle";
import ProductFilter from "./ProductFilter";
import type { BlockRegistryEntry } from "./types";
declare const organismEntries: {
    readonly AnnouncementBar: {
        readonly component: typeof AnnouncementBar;
    };
    readonly HeroBanner: {
        readonly component: typeof HeroBanner;
    };
    readonly ValueProps: {
        readonly component: typeof ValueProps;
    };
    readonly ReviewsCarousel: {
        readonly component: typeof ReviewsCarousel;
    };
    readonly ProductGrid: {
        readonly component: typeof ProductGrid;
        readonly getRuntimeProps: typeof getProductGridRuntimeProps;
    };
    readonly ProductCarousel: {
        readonly component: typeof ProductCarousel;
        readonly getRuntimeProps: typeof getProductCarouselRuntimeProps;
    };
    readonly RecommendationCarousel: {
        readonly component: typeof RecommendationCarousel;
        readonly getRuntimeProps: typeof getRecommendationCarouselRuntimeProps;
    };
    readonly FeaturedProduct: {
        readonly component: typeof FeaturedProductBlock;
        readonly getRuntimeProps: typeof getFeaturedProductRuntimeProps;
    };
    readonly ImageSlider: {
        readonly component: typeof ImageSlider;
    };
    readonly CollectionList: {
        readonly component: typeof CollectionList;
    };
    readonly Gallery: {
        readonly component: typeof Gallery;
    };
    readonly Lookbook: {
        readonly component: typeof Lookbook;
    };
    readonly ContactForm: {
        readonly component: typeof ContactForm;
    };
    readonly ContactFormWithMap: {
        readonly component: typeof ContactFormWithMap;
    };
    readonly BlogListing: {
        readonly component: typeof BlogListing;
    };
    readonly Testimonials: {
        readonly component: typeof Testimonials;
    };
    readonly TestimonialSlider: {
        readonly component: typeof TestimonialSlider;
    };
    readonly MapBlock: {
        readonly component: typeof MapBlock;
    };
    readonly StoreLocatorBlock: {
        readonly component: typeof StoreLocatorBlock;
    };
    readonly VideoBlock: {
        readonly component: typeof VideoBlock;
    };
    readonly FAQBlock: {
        readonly component: typeof FAQBlock;
    };
    readonly CountdownTimer: {
        readonly component: typeof CountdownTimer;
    };
    readonly SocialLinks: {
        readonly component: typeof SocialLinks;
    };
    readonly SocialFeed: {
        readonly component: typeof SocialFeed;
    };
    readonly SocialProof: {
        readonly component: typeof SocialProof;
    };
    readonly NewsletterSignup: {
        readonly component: typeof NewsletterSignup;
    };
    readonly SearchBar: {
        readonly component: typeof SearchBar;
    };
    readonly PricingTable: {
        readonly component: typeof PricingTable;
    };
    readonly Tabs: {
        readonly component: typeof Tabs;
    };
    readonly ProductComparison: {
        readonly component: typeof ProductComparisonBlock;
    };
    readonly GiftCardBlock: {
        readonly component: typeof GiftCardBlock;
    };
    readonly FormBuilderBlock: {
        readonly component: typeof FormBuilderBlock;
    };
    readonly PopupModal: {
        readonly component: typeof PopupModal;
    };
    readonly ProductBundle: {
        readonly component: typeof ProductBundle;
        readonly getRuntimeProps: typeof getProductBundleRuntimeProps;
    };
    readonly ProductFilter: {
        readonly component: typeof ProductFilter;
    };
};
type OrganismRegistry = {
    [K in keyof typeof organismEntries]: BlockRegistryEntry<any>;
};
export declare const organismRegistry: OrganismRegistry;
export type OrganismBlockType = keyof typeof organismEntries;
export {};
//# sourceMappingURL=organisms.d.ts.map
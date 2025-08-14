import { lazy } from "react";

const editorRegistry = {
  ContactForm: lazy(() => import("./ContactFormEditor")),
  Gallery: lazy(() => import("./GalleryEditor")),
  Image: lazy(() => import("./ImageBlockEditor")),
  Testimonials: lazy(() => import("./TestimonialsEditor")),
  PricingTable: lazy(() => import("./PricingTableEditor")),
  HeroBanner: lazy(() => import("./HeroBannerEditor")),
  AnnouncementBar: lazy(() => import("./AnnouncementBarEditor")),
  NewsletterSignup: lazy(() => import("./NewsletterSignupEditor")),
  SearchBar: lazy(() => import("./SearchBarEditor")),
  ProductFilter: lazy(() => import("./ProductFilterEditor")),
  ImageSlider: lazy(() => import("./ImageSliderEditor")),
  CollectionList: lazy(() => import("./CollectionListEditor")),
  RecommendationCarousel: lazy(() => import("./RecommendationCarouselEditor")),
  ProductComparison: lazy(() => import("./ProductComparisonEditor")),
  ProductBundle: lazy(() => import("./ProductBundleEditor")),
  GiftCardBlock: lazy(() => import("./GiftCardEditor")),
  FormBuilderBlock: lazy(() => import("./FormBuilderEditor")),
  PopupModal: lazy(() => import("./PopupModalEditor")),
  ValueProps: lazy(() => import("./ValuePropsEditor")),
  ReviewsCarousel: lazy(() => import("./ReviewsCarouselEditor")),
  SocialFeed: lazy(() => import("./SocialFeedEditor")),
  SocialProof: lazy(() => import("./SocialProofEditor")),
  MapBlock: lazy(() => import("./MapBlockEditor")),
  StoreLocatorBlock: lazy(() => import("./StoreLocatorBlockEditor")),
  VideoBlock: lazy(() => import("./VideoBlockEditor")),
  FAQBlock: lazy(() => import("./FAQBlockEditor")),
  CountdownTimer: lazy(() => import("./CountdownTimerEditor")),
  SocialLinks: lazy(() => import("./SocialLinksEditor")),
  Header: lazy(() => import("./HeaderEditor")),
  Footer: lazy(() => import("./FooterEditor")),
  Button: lazy(() => import("./ButtonEditor")),
  Tabs: lazy(() => import("./TabsEditor")),
  ProductGrid: lazy(() => import("./ProductListEditor")),
  ProductCarousel: lazy(() => import("./ProductListEditor")),
  CustomHtml: lazy(() => import("./CustomHtmlEditor")),
} as const;

export type EditorRegistry = typeof editorRegistry;

export default editorRegistry;


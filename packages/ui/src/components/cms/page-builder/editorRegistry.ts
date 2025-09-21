import { lazy } from "react";
import type { LazyExoticComponent, ComponentType } from "react";
import type { EditorProps } from "./EditorProps";

// Helper to coerce lazy modules to the shared EditorProps
const lazyEditor = (
  loader: () => Promise<{ default: ComponentType<any> }>
): LazyExoticComponent<ComponentType<EditorProps>> =>
  lazy(loader) as unknown as LazyExoticComponent<ComponentType<EditorProps>>;

const editorRegistry: Record<string, LazyExoticComponent<ComponentType<EditorProps>>> = {
  ContactForm: lazyEditor(() => import("./ContactFormEditor")),
  Gallery: lazyEditor(() => import("./GalleryEditor")),
  Image: lazyEditor(() => import("./ImageBlockEditor")),
  Lookbook: lazyEditor(() => import("./LookbookEditor")),
  Testimonials: lazyEditor(() => import("./TestimonialsEditor")),
  PricingTable: lazyEditor(() => import("./PricingTableEditor")),
  HeroBanner: lazyEditor(() => import("./HeroBannerEditor")),
  AnnouncementBar: lazyEditor(() => import("./AnnouncementBarEditor")),
  NewsletterSignup: lazyEditor(() => import("./NewsletterSignupEditor")),
  SearchBar: lazyEditor(() => import("./SearchBarEditor")),
  ImageSlider: lazyEditor(() => import("./ImageSliderEditor")),
  CollectionList: lazyEditor(() => import("./CollectionListEditor")),
  RecommendationCarousel: lazyEditor(() => import("./RecommendationCarouselEditor")),
  ProductComparison: lazyEditor(() => import("./ProductComparisonEditor")),
  ProductBundle: lazyEditor(() => import("./ProductBundleEditor")),
  GiftCardBlock: lazyEditor(() => import("./GiftCardEditor")),
  FormBuilderBlock: lazyEditor(() => import("./FormBuilderEditor")),
  PopupModal: lazyEditor(() => import("./PopupModalEditor")),
  ValueProps: lazyEditor(() => import("./ValuePropsEditor")),
  ReviewsCarousel: lazyEditor(() => import("./ReviewsCarouselEditor")),
  SocialFeed: lazyEditor(() => import("./SocialFeedEditor")),
  SocialProof: lazyEditor(() => import("./SocialProofEditor")),
  MapBlock: lazyEditor(() => import("./MapBlockEditor")),
  StoreLocatorBlock: lazyEditor(() => import("./StoreLocatorBlockEditor")),
  VideoBlock: lazyEditor(() => import("./VideoBlockEditor")),
  FAQBlock: lazyEditor(() => import("./FAQBlockEditor")),
  Header: lazyEditor(() => import("./HeaderEditor")),
  Footer: lazyEditor(() => import("./FooterEditor")),
  ProductFilter: lazyEditor(() => import("./ProductFilterEditor")),
  CountdownTimer: lazyEditor(() => import("./CountdownTimerEditor")),
  SocialLinks: lazyEditor(() => import("./SocialLinksEditor")),
  Button: lazyEditor(() => import("./ButtonEditor")),
  Tabs: lazyEditor(() => import("./TabsEditor")),
  Dataset: lazyEditor(() => import("./DatasetEditor")),
  Repeater: lazyEditor(() => import("./RepeaterEditor")),
  Bind: lazyEditor(() => import("./BindEditor")),
  ProductGrid: lazyEditor(() => import("./ProductGridEditor")),
  ProductCarousel: lazyEditor(() => import("./ProductGridEditor")),
  CustomHtml: lazyEditor(() => import("./CustomHtmlEditor")),
  Section: lazyEditor(() => import("./SectionEditor")),
  StackFlex: lazyEditor(() => import("./StackFlexEditor")),
  Grid: lazyEditor(() => import("./GridContainerEditor")),
  CarouselContainer: lazyEditor(() => import("./CarouselContainerEditor")),
  TabsAccordionContainer: lazyEditor(() => import("./TabsAccordionContainerEditor")),
};

export default editorRegistry;

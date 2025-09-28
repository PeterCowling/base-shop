import { lazy } from "react";
import type { LazyExoticComponent, ComponentType } from "react";
import type { EditorProps } from "./EditorProps";

// Helper to coerce lazy modules to the shared EditorProps
// We intentionally use `any` here to allow heterogeneous editor prop types.
const lazyEditor = (
  loader: () => Promise<any>,
): LazyExoticComponent<ComponentType<any>> =>
  lazy(loader) as unknown as LazyExoticComponent<ComponentType<any>>;

// Heterogeneous editors with distinct, specific props; keep as `any` to avoid brittle unions.
const editorRegistry: Record<string, LazyExoticComponent<ComponentType<any>>> = {
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

// In tests, ensure the most common editor loads synchronously to avoid flakiness
if (process.env.NODE_ENV === "test") {
  // Load Button editor synchronously in tests to reduce flakiness
  // Avoid require(); use dynamic import and a resolved Promise.
  import("./ButtonEditor")
    .then(({ default: Btn }) => {
      editorRegistry.Button = lazy(
        () => Promise.resolve({ default: Btn })
      ) as unknown as LazyExoticComponent<ComponentType<EditorProps>>;
    })
    .catch(() => {});
}

export default editorRegistry;

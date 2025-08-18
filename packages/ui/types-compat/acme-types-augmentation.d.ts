/* Augment @acme/types with names @acme/ui expects but which aren't exported yet.
   These are intentionally wide to unblock builds. Tighten them as real types land. */
declare module "@acme/types" {
  // Core page builder
  export type HistoryState = any;
  export type Page = any;
  export type PageComponent = any;
  export type PageComponentBase = any;
  export const pageComponentSchema: any; // runtime schema placeholder
  export type UpgradeComponent = any;

  // Commerce types
  export type SKU = any;
  export type RentalOrder = any;
  export type PublishLocation = any;
  export type ApiError = any;
  export type WishlistItem = any;

  // Media
  export type ImageOrientation = any;
  export type MediaItem = any;

  // Components used around the UI
  export type AnnouncementBarComponent = any;
  export type ButtonComponent = any;
  export type CollectionListComponent = any;
  export type ContactFormComponent = any;
  export type CountdownTimerComponent = any;
  export type CustomHtmlComponent = any;
  export type FAQBlockComponent = any;
  export type FooterComponent = any;
  export type GalleryComponent = any;
  export type GiftCardBlockComponent = any;
  export type HeaderComponent = any;
  export type HeroBannerComponent = any;
  export type ImageComponent = any;
  export type ImageSliderComponent = any;
  export type LookbookComponent = any;
  export type MapBlockComponent = any;
  export type NewsletterSignupComponent = any;
  export type PopupModalComponent = any;
  export type PricingTableComponent = any;
  export type ProductGridComponent = any;
  export type RecommendationCarouselComponent = any;
  export type ReviewsCarouselComponent = any;
  export type SearchBarComponent = any;
  export type SocialFeedComponent = any;
  export type SocialLinksComponent = any;
  export type SocialProofComponent = any;
  export type StoreLocatorBlockComponent = any;
  export type TabsComponent = any;
  export type ValuePropsComponent = any;
  export type VideoBlockComponent = any;
  export type FormField = any;
  export type FormFieldOption = any;
  export type TestimonialsComponent = any;
}

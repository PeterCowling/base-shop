/* Augment @acme/types with the names @acme/ui currently imports but that aren't exported yet.
   These are intentionally loose (any) to unblock builds. Tighten as real types land. */
declare module "@acme/types" {
  export type HistoryState = any;
  export type Page = any;
  export type PageComponent = any;
  export type FormField = any;
  export type FormFieldOption = any;

  export const pageComponentSchema: any; // value export used in a few places

  export type AnnouncementBarComponent = any;
  export type ButtonComponent = any;
  export type CollectionListComponent = any;
  export type CountdownTimerComponent = any;
  export type CustomHtmlComponent = any;
  export type FAQBlockComponent = any;
  export type FooterComponent = any;
  export type GiftCardBlockComponent = any;
  export type ImageSliderComponent = any;
  export type LookbookComponent = any;
  export type MapBlockComponent = any;
  export type NewsletterSignupComponent = any;
  export type PopupModalComponent = any;
  export type PricingTableComponent = any;
  export type RecommendationCarouselComponent = any;
  export type SearchBarComponent = any;
  export type SocialFeedComponent = any;
  export type SocialLinksComponent = any;
  export type SocialProofComponent = any;
  export type StoreLocatorBlockComponent = any;
  export type TestimonialsComponent = any;
  export type TabsComponent = any;
  export type VideoBlockComponent = any;
}

/* More names @acme/ui imports but @acme/types doesn’t export yet */
declare module "@acme/types" {
  export type SKU = any;
  export type RentalOrder = any;
  export type PublishLocation = any;
  export type WishlistItem = any;
  export type ProductPublication = any;
  export type Locale = any;

  export type MediaItem = any;
  export type ImageOrientation = any;
  export type ApiError = any;
  export type GalleryMediaItem = any;

  export type UpgradeComponent = any;
  export type PageComponentBase = any;
}

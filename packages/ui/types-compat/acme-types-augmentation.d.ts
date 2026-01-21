declare module "@acme/types" {
  /** Core product-ish types expected by UI */
  export interface MediaItem {
    id?: string;
    type?: "image" | "video" | string;
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    tags?: string[];
    uploadedAt?: string;
    size?: number;
    [k: string]: any;
  }
  export type ImageOrientation = "landscape" | "portrait" | "square" | string;

  export interface SKU {
    id?: string;
    title?: string;
    price?: number;
    deposit?: number;
    media?: MediaItem[];
    [k: string]: any;
  }

  export interface CartLine {
    sku: SKU;
    qty: number;
    [k: string]: any;
  }

  export interface PublishLocation {
    id: string;
    slug?: string;
    title?: string;
    [k: string]: any;
  }

  export interface RentalOrder {
    id?: string;
    items?: any[];
    [k: string]: any;
  }

  export type ApiError = any;

  /** Page & PageBuilder family used across the CMS/editor */
  export interface Page {
    id: string;
    slug: string;
    title?: string;
    components: PageComponent[];
    [k: string]: any;
  }
  export interface PageComponentBase {
    id: string;
    type: string;
    [k: string]: any;
  }
  export type PageComponent = PageComponentBase & Record<string, any>;

  // Components (keep them loose but present)
  export interface TextComponent extends PageComponentBase {
    type: "Text";
    text?: string;
  }

  export type AnnouncementBarComponent = PageComponentBase;
  export type ButtonComponent = PageComponentBase;
  export type CollectionListComponent = PageComponentBase;
  export type ContactFormComponent = PageComponentBase;
  export type CountdownTimerComponent = PageComponentBase;
  export type CustomHtmlComponent = PageComponentBase;
  export type FAQBlockComponent = PageComponentBase;
  export type FooterComponent = PageComponentBase;
  export type GalleryComponent = PageComponentBase;
  export type GiftCardBlockComponent = PageComponentBase;
  export type HeaderComponent = PageComponentBase;
  export type HeroBannerComponent = PageComponentBase;
  export type ImageComponent = PageComponentBase;
  export type ImageSliderComponent = PageComponentBase;
  export type LookbookComponent = PageComponentBase;
  export type MapBlockComponent = PageComponentBase;
  export type NewsletterSignupComponent = PageComponentBase;
  export type PricingTableComponent = PageComponentBase;
  export type ProductGridComponent = PageComponentBase;
  export type RecommendationCarouselComponent = PageComponentBase;
  export type ReviewsCarouselComponent = PageComponentBase;
  export type SearchBarComponent = PageComponentBase;
  export type SocialFeedComponent = PageComponentBase;
  export type SocialLinksComponent = PageComponentBase;
  export type SocialProofComponent = PageComponentBase;
  export type StoreLocatorBlockComponent = PageComponentBase;
  export type TabsComponent = PageComponentBase;
  export type TestimonialsComponent = PageComponentBase;
  export type ValuePropsComponent = PageComponentBase;
  export type VideoBlockComponent = PageComponentBase;
  export interface UpgradeComponent {
    file: string;
    componentName: string;
    oldChecksum?: string | null;
    newChecksum: string;
  }
  export type PopupModalComponent = PageComponentBase;

  /** Forms */
  export type FormField = any;
  export type FormFieldOption = any;

  /** Publications / workflow */
  export type ProductPublication = any;
  export type PublicationStatus = string;

  /** PageBuilder state */
  export type HistoryState = any;

  /** Schema value used by the editor (ok to be 'any' at type-time) */
  export const pageComponentSchema: any;
}

import { z } from "zod";
import { type Translated } from "./Product";
export type PageStatus = "draft" | "published";
export interface SeoMeta {
  title: Translated;
  description?: Translated;
  image?: Translated;
}
export interface PageComponentBase {
  id: string;
  type: string;
  /**
   * Width of the rendered component. Can be a pixel value (e.g. "300px")
   * or a percentage (e.g. "50%").
   */
  width?: string;
  /** Width on large (desktop) viewports. Overrides `width` when provided. */
  widthDesktop?: string;
  /** Width on medium (tablet) viewports. Overrides `width` when provided. */
  widthTablet?: string;
  /** Width on small (mobile) viewports. Overrides `width` when provided. */
  widthMobile?: string;
  /**
   * Height of the rendered component. Can be a pixel value or percentage.
   */
  height?: string;
  /** Height on large (desktop) viewports. Overrides `height` when provided. */
  heightDesktop?: string;
  /** Height on medium (tablet) viewports. Overrides `height` when provided. */
  heightTablet?: string;
  /** Height on small (mobile) viewports. Overrides `height` when provided. */
  heightMobile?: string;
  /**
   * CSS position property used when rendering the component.
   */
  position?: "relative" | "absolute";
  /**
   * Offset from the top when position is absolute.
   */
  top?: string;
  /**
   * Offset from the left when position is absolute.
   */
  left?: string;
  /**
   * Margin applied to the outer container when rendered.
   * Accepts any valid CSS margin value or Tailwind class.
   */
  margin?: string;
  /** Margin on large (desktop) viewports. Overrides `margin` when provided. */
  marginDesktop?: string;
  /** Margin on medium (tablet) viewports. Overrides `margin` when provided. */
  marginTablet?: string;
  /** Margin on small (mobile) viewports. Overrides `margin` when provided. */
  marginMobile?: string;
  /**
   * Padding applied to the outer container when rendered.
   * Accepts any valid CSS padding value or Tailwind class.
   */
  padding?: string;
  /** Padding on large (desktop) viewports. Overrides `padding` when provided. */
  paddingDesktop?: string;
  /** Padding on medium (tablet) viewports. Overrides `padding` when provided. */
  paddingTablet?: string;
  /** Padding on small (mobile) viewports. Overrides `padding` when provided. */
  paddingMobile?: string;
  /** Minimum number of items allowed for list components */
  minItems?: number;
  /** Maximum number of items allowed for list components */
  maxItems?: number;
  [key: string]: unknown;
}
export interface HeaderComponent extends PageComponentBase {
  type: "Header";
  nav?: {
    label: string;
    url: string;
  }[];
  logo?: string;
}
export interface FooterComponent extends PageComponentBase {
  type: "Footer";
  links?: {
    label: string;
    url: string;
  }[];
  logo?: string;
}

export interface SocialLinksComponent extends PageComponentBase {
  type: "SocialLinks";
  facebook?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
}
export interface SocialFeedComponent extends PageComponentBase {
  type: "SocialFeed";
  platform?: "twitter" | "instagram";
  account?: string;
  hashtag?: string;
}
export interface SocialProofComponent extends PageComponentBase {
  type: "SocialProof";
  source?: string;
  frequency?: number;
}
export interface AnnouncementBarComponent extends PageComponentBase {
  type: "AnnouncementBar";
  text?: string;
  link?: string;
  closable?: boolean;
}
export interface HeroBannerComponent extends PageComponentBase {
  type: "HeroBanner";
  slides?: {
    src: string;
    alt?: string;
    headlineKey: string;
    ctaKey: string;
  }[];
}
export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
  items?: {
    icon: string;
    title: string;
    desc: string;
  }[];
}
/** Carousel of customer reviews. `minItems`/`maxItems` limit visible reviews */
export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
  reviews?: {
    nameKey: string;
    quoteKey: string;
  }[];
}
/** Grid of products; `minItems`/`maxItems` clamp the responsive product count */
export interface ProductGridComponent extends PageComponentBase {
  type: "ProductGrid";
  skus?: string[];
  collectionId?: string;
  mode?: "collection" | "manual";
}
/** Carousel of products; `minItems`/`maxItems` clamp visible products */
export interface ProductCarouselComponent extends PageComponentBase {
  type: "ProductCarousel";
  skus?: string[];
  collectionId?: string;
  mode?: "collection" | "manual";
}
/** Grid of collections; `minItems`/`maxItems` clamp visible collections */
export interface CollectionListComponent extends PageComponentBase {
  type: "CollectionList";
  collections?: { id: string; title: string; image: string }[];
  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;
}
/** Carousel of recommended products fetched from an API */
export interface RecommendationCarouselComponent extends PageComponentBase {
  type: "RecommendationCarousel";
  endpoint: string;
}
export interface GalleryComponent extends PageComponentBase {
  type: "Gallery";
  images?: {
    src: string;
    alt?: string;
  }[];
}
export interface ImageSliderComponent extends PageComponentBase {
  type: "ImageSlider";
  slides?: {
    src: string;
    alt?: string;
    caption?: string;
  }[];
  minItems?: number;
  maxItems?: number;
}
export interface ContactFormComponent extends PageComponentBase {
  type: "ContactForm";
  action?: string;
  method?: string;
}
export interface NewsletterSignupComponent extends PageComponentBase {
  type: "NewsletterSignup";
  text?: string;
  action?: string;
  placeholder?: string;
  submitLabel?: string;
}
export interface SearchBarComponent extends PageComponentBase {
  type: "SearchBar";
  placeholder?: string;
  limit?: number;
}
export interface ContactFormWithMapComponent extends PageComponentBase {
  type: "ContactFormWithMap";
  mapSrc?: string;
}
export interface MapBlockComponent extends PageComponentBase {
  type: "MapBlock";
  lat?: number;
  lng?: number;
  zoom?: number;
}
export interface StoreLocatorBlockComponent extends PageComponentBase {
  type: "StoreLocatorBlock";
  locations?: {
    lat?: number;
    lng?: number;
    label?: string;
  }[];
  zoom?: number;
}
export interface VideoBlockComponent extends PageComponentBase {
  type: "VideoBlock";
  src?: string;
  autoplay?: boolean;
}
export interface FAQBlockComponent extends PageComponentBase {
  type: "FAQBlock";
  items?: {
    question: string;
    answer: string;
  }[];
}
export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
}
export interface TextComponent extends PageComponentBase {
  type: "Text";
  text?: string;
}

export interface CustomHtmlComponent extends PageComponentBase {
  type: "CustomHtml";
  html?: string;
}

export interface ButtonComponent extends PageComponentBase {
  type: "Button";
  label?: string;
  href?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}
export interface BlogListingComponent extends PageComponentBase {
  type: "BlogListing";
  posts?: {
    title: string;
    excerpt?: string;
    url?: string;
  }[];
}
/** Slider of testimonials. `minItems`/`maxItems` limit visible testimonials */
export interface TestimonialSliderComponent extends PageComponentBase {
  type: "TestimonialSlider";
  testimonials?: {
    quote: string;
    name?: string;
  }[];
}
export interface TestimonialsComponent extends PageComponentBase {
  type: "Testimonials";
  testimonials?: {
    quote: string;
    name?: string;
  }[];
}

export interface GiftCardBlockComponent extends PageComponentBase {
  type: "GiftCardBlock";
  denominations?: number[];
  description?: string;
}
export interface PopupModalComponent extends PageComponentBase {
  type: "PopupModal";
  trigger?: "load" | "delay" | "exit";
  delay?: number;
  content?: string;
}
export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
}
export interface MultiColumnComponent extends PageComponentBase {
  type: "MultiColumn";
  columns?: number;
  gap?: string;
  children?: PageComponent[];
}
export interface TabsComponent extends PageComponentBase {
  type: "Tabs";
  labels?: string[];
  active?: number;
  children?: PageComponent[];
}
export type PageComponent =
  | AnnouncementBarComponent
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent
  | ProductGridComponent
  | ProductCarouselComponent
  | CollectionListComponent
  | RecommendationCarouselComponent
  | GalleryComponent
  | ImageSliderComponent
  | ContactFormComponent
  | NewsletterSignupComponent
  | SearchBarComponent
  | ContactFormWithMapComponent
  | MapBlockComponent
  | StoreLocatorBlockComponent
  | VideoBlockComponent
  | FAQBlockComponent
  | BlogListingComponent
  | TestimonialsComponent
  | GiftCardBlockComponent
  | PopupModalComponent
  | TestimonialSliderComponent
  | ImageComponent
  | TextComponent
  | CustomHtmlComponent
  | ButtonComponent
  | HeaderComponent
  | FooterComponent
  | SocialLinksComponent
  | SocialFeedComponent
  | SocialProofComponent
  | SectionComponent
  | MultiColumnComponent
  | TabsComponent;
export declare const pageSchema: z.ZodObject<
  {
    id: z.ZodString;
    slug: z.ZodString;
    status: z.ZodEnum<["draft", "published"]>;
    components: z.ZodDefault<
      z.ZodArray<
        z.ZodObject<
          {
            id: z.ZodString;
            type: z.ZodString;
          },
          "passthrough",
          z.ZodTypeAny,
          z.objectOutputType<
            {
              id: z.ZodString;
              type: z.ZodString;
            },
            z.ZodTypeAny,
            "passthrough"
          >,
          z.objectInputType<
            {
              id: z.ZodString;
              type: z.ZodString;
            },
            z.ZodTypeAny,
            "passthrough"
          >
        >,
        "many"
      >
    >;
    seo: z.ZodObject<
      {
        title: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>;
        description: z.ZodOptional<
          z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>
        >;
        image: z.ZodOptional<
          z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>
        >;
      },
      "strip",
      z.ZodTypeAny,
      {
        title: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
      },
      {
        title: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
      }
    >;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    id: string;
    slug: string;
    status: "draft" | "published";
    components: z.objectOutputType<
      {
        id: z.ZodString;
        type: z.ZodString;
      },
      z.ZodTypeAny,
      "passthrough"
    >[];
    seo: {
      title: Partial<Record<"en" | "de" | "it", string>>;
      image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
      description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  },
  {
    id: string;
    slug: string;
    status: "draft" | "published";
    seo: {
      title: Partial<Record<"en" | "de" | "it", string>>;
      image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
      description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    components?:
      | z.objectInputType<
          {
            id: z.ZodString;
            type: z.ZodString;
          },
          z.ZodTypeAny,
          "passthrough"
        >[]
      | undefined;
  }
>;
export type Page = z.infer<typeof pageSchema>;
//# sourceMappingURL=Page.d.ts.map

import { z } from "zod";
import { localeSchema, type Translated } from "./Product";

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
   * Width of the rendered component. Supports any CSS length including
   * pixel values (e.g. "300px"), percentages (e.g. "50%"), or viewport
   * units (e.g. "30vw").
   */
  width?: string;
  /**
   * Height of the rendered component. Supports any CSS length such as
   * pixels, percentages or viewport units.
   */
  height?: string;
  /**
   * CSS position property used when rendering the component.
   */
  position?: "relative" | "absolute";
  /**
   * Offset from the top when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  top?: string;
  /**
   * Offset from the left when position is absolute. Accepts any CSS length
   * including pixels, percentages or viewport units.
   */
  left?: string;
  /**
   * Margin applied to the outer container when rendered.
   * Accepts any valid CSS margin value or Tailwind class.
   */
  margin?: string;
  /**
   * Padding applied to the outer container when rendered.
   * Accepts any valid CSS padding value or Tailwind class.
   */
  padding?: string;
  /** Minimum number of items allowed for components with lists */
  minItems?: number;
  /** Maximum number of items allowed for components with lists */
  maxItems?: number;
  [key: string]: unknown;
}

export interface HeaderComponent extends PageComponentBase {
  type: "Header";
  nav?: { label: string; url: string }[];
  logo?: string;
}

export interface FooterComponent extends PageComponentBase {
  type: "Footer";
  links?: { label: string; url: string }[];
  logo?: string;
}

export interface AnnouncementBarComponent extends PageComponentBase {
  type: "AnnouncementBar";
  text?: string;
  link?: string;
  closable?: boolean;
}

export interface HeroBannerComponent extends PageComponentBase {
  type: "HeroBanner";
  slides?: { src: string; alt?: string; headlineKey: string; ctaKey: string }[];
}

export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
  items?: { icon: string; title: string; desc: string }[];
}

/** Carousel of customer reviews. `minItems`/`maxItems` limit visible reviews */
export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
  reviews?: { nameKey: string; quoteKey: string }[];
}

/** Grid of products; `minItems`/`maxItems` clamp the responsive product count */
export interface ProductGridComponent extends PageComponentBase {
  type: "ProductGrid";
}

/** Carousel of products; `minItems`/`maxItems` clamp visible products */
export interface ProductCarouselComponent extends PageComponentBase {
  type: "ProductCarousel";
}

/** Carousel of recommended products fetched from an API. `minItems`/`maxItems` limit visible products */
export interface RecommendationCarouselComponent extends PageComponentBase {
  type: "RecommendationCarousel";
  endpoint: string;
}

export interface GalleryComponent extends PageComponentBase {
  type: "Gallery";
  images?: { src: string; alt?: string }[];
}

export interface ContactFormComponent extends PageComponentBase {
  type: "ContactForm";
  action?: string;
  method?: string;
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

export interface VideoBlockComponent extends PageComponentBase {
  type: "VideoBlock";
  src?: string;
  autoplay?: boolean;
}

export interface FAQBlockComponent extends PageComponentBase {
  type: "FAQBlock";
  items?: { question: string; answer: string }[];
}

export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
}

export interface BlogListingComponent extends PageComponentBase {
  type: "BlogListing";
  posts?: { title: string; excerpt?: string; url?: string }[];
}

/** Slider of testimonials. `minItems`/`maxItems` limit visible testimonials */
export interface TestimonialSliderComponent extends PageComponentBase {
  type: "TestimonialSlider";
  testimonials?: { quote: string; name?: string }[];
}

export interface TestimonialsComponent extends PageComponentBase {
  type: "Testimonials";
  testimonials?: { quote: string; name?: string }[];
}

export interface TextComponent extends PageComponentBase {
  type: "Text";
  text?: string;
}

export interface SocialLinksComponent extends PageComponentBase {
  type: "SocialLinks";
  instagram?: string;
  facebook?: string;
  x?: string;
  linkedin?: string;
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

export type PageComponent =
  | AnnouncementBarComponent
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent
  | ProductGridComponent
  | ProductCarouselComponent
  | RecommendationCarouselComponent
  | GalleryComponent
  | ContactFormComponent
  | ContactFormWithMapComponent
  | MapBlockComponent
  | VideoBlockComponent
  | FAQBlockComponent
  | BlogListingComponent
  | TestimonialsComponent
  | TestimonialSliderComponent
  | ImageComponent
  | TextComponent
  | SocialLinksComponent
  | HeaderComponent
  | FooterComponent
  | SectionComponent
  | MultiColumnComponent;

const baseComponentSchema = z
  .object({
    id: z.string(),
    width: z.string().optional(),
    height: z.string().optional(),
    position: z.enum(["relative", "absolute"]).optional(),
    top: z.string().optional(),
    left: z.string().optional(),
    margin: z.string().optional(),
    padding: z.string().optional(),
    minItems: z.number().int().min(0).optional(),
    maxItems: z.number().int().min(0).optional(),
  })
  .passthrough();

const heroBannerComponentSchema = baseComponentSchema.extend({
  type: z.literal("HeroBanner"),
  slides: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        headlineKey: z.string(),
        ctaKey: z.string(),
      })
    )
    .optional(),
});

const announcementBarComponentSchema = baseComponentSchema.extend({
  type: z.literal("AnnouncementBar"),
  text: z.string().optional(),
  link: z.string().optional(),
  closable: z.boolean().optional(),
});

const valuePropsComponentSchema = baseComponentSchema.extend({
  type: z.literal("ValueProps"),
  items: z
    .array(z.object({ icon: z.string(), title: z.string(), desc: z.string() }))
    .optional(),
});

const reviewsCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ReviewsCarousel"),
  reviews: z
    .array(z.object({ nameKey: z.string(), quoteKey: z.string() }))
    .optional(),
});

const productGridComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductGrid"),
});

const productCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductCarousel"),
});

const recommendationCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("RecommendationCarousel"),
  endpoint: z.string(),
});

const galleryComponentSchema = baseComponentSchema.extend({
  type: z.literal("Gallery"),
  images: z
    .array(z.object({ src: z.string(), alt: z.string().optional() }))
    .optional(),
});

const contactFormComponentSchema = baseComponentSchema.extend({
  type: z.literal("ContactForm"),
  action: z.string().optional(),
  method: z.string().optional(),
});

const contactFormWithMapComponentSchema = baseComponentSchema.extend({
  type: z.literal("ContactFormWithMap"),
  mapSrc: z.string().optional(),
});

const mapBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("MapBlock"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().optional(),
});

const videoBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("VideoBlock"),
  src: z.string().optional(),
  autoplay: z.boolean().optional(),
});

const faqBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("FAQBlock"),
  items: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
});

const headerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Header"),
  nav: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
  logo: z.string().optional(),
});

const footerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Footer"),
  links: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
  logo: z.string().optional(),
});

const blogListingComponentSchema = baseComponentSchema.extend({
  type: z.literal("BlogListing"),
  posts: z
    .array(
      z.object({
        title: z.string(),
        excerpt: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
});

const testimonialSliderComponentSchema = baseComponentSchema.extend({
  type: z.literal("TestimonialSlider"),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string().optional() }))
    .optional(),
});

const testimonialsComponentSchema = baseComponentSchema.extend({
  type: z.literal("Testimonials"),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string().optional() }))
    .optional(),
});

const imageComponentSchema = baseComponentSchema.extend({
  type: z.literal("Image"),
  src: z.string().optional(),
  alt: z.string().optional(),
});

const socialLinksComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialLinks"),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  x: z.string().optional(),
  linkedin: z.string().optional(),
});

const textComponentSchema = baseComponentSchema.extend({
  type: z.literal("Text"),
  text: z.string().optional(),
});

const sectionComponentSchema: z.ZodType<SectionComponent> =
  baseComponentSchema.extend({
    type: z.literal("Section"),
    children: z.array(z.lazy(() => pageComponentSchema)).default([]),
  });

const multiColumnComponentSchema: z.ZodType<MultiColumnComponent> =
  baseComponentSchema.extend({
    type: z.literal("MultiColumn"),
    columns: z.number().optional(),
    gap: z.string().optional(),
    children: z.array(z.lazy(() => pageComponentSchema)).default([]),
  });

export const pageComponentSchema: z.ZodType<PageComponent> = z.lazy(() =>
  z.discriminatedUnion("type", [
    announcementBarComponentSchema,
    heroBannerComponentSchema,
    valuePropsComponentSchema,
    reviewsCarouselComponentSchema,
    productGridComponentSchema,
    productCarouselComponentSchema,
    recommendationCarouselComponentSchema,
    galleryComponentSchema,
    contactFormComponentSchema,
    contactFormWithMapComponentSchema,
    mapBlockComponentSchema,
    videoBlockComponentSchema,
    faqBlockComponentSchema,
    headerComponentSchema,
    footerComponentSchema,
    blogListingComponentSchema,
    testimonialsComponentSchema,
    testimonialSliderComponentSchema,
    imageComponentSchema,
    socialLinksComponentSchema,
    textComponentSchema,
    sectionComponentSchema,
    multiColumnComponentSchema,
  ])
);

export interface HistoryState {
  past: PageComponent[][];
  present: PageComponent[];
  future: PageComponent[][];
}

export const historyStateSchema: z.ZodType<HistoryState> = z
  .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
  })
  .strict()
  .default({ past: [], present: [], future: [] });

export const pageSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    status: z.enum(["draft", "published"]),
    components: z.array(pageComponentSchema).default([]),
    seo: z.object({
      title: z.record(localeSchema, z.string()),
      description: z.record(localeSchema, z.string()).optional(),
      image: z.record(localeSchema, z.string()).optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
    history: historyStateSchema.optional(),
  })
  .strict();

export type Page = z.infer<typeof pageSchema>;

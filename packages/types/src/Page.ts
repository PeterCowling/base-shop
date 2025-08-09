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
  /** Minimum columns allowed for grid components */
  minCols?: number;
  /** Maximum columns allowed for grid components */
  maxCols?: number;
  [key: string]: unknown;
}

export interface HeroBannerComponent extends PageComponentBase {
  type: "HeroBanner";
  slides?: { src: string; alt?: string; headlineKey: string; ctaKey: string }[];
}

export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
  items?: { icon: string; title: string; desc: string }[];
}

export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
  reviews?: { nameKey: string; quoteKey: string }[];
}

export interface ProductGridComponent extends PageComponentBase {
  type: "ProductGrid";
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

export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
}

export interface BlogListingComponent extends PageComponentBase {
  type: "BlogListing";
  posts?: { title: string; excerpt?: string; url?: string }[];
}

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

export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
}

export type PageComponent =
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent
  | ProductGridComponent
  | GalleryComponent
  | ContactFormComponent
  | ContactFormWithMapComponent
  | BlogListingComponent
  | TestimonialsComponent
  | TestimonialSliderComponent
  | ImageComponent
  | TextComponent
  | SectionComponent;

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
    minItems: z.number().optional(),
    maxItems: z.number().optional(),
    minCols: z.number().optional(),
    maxCols: z.number().optional(),
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

const valuePropsComponentSchema = baseComponentSchema.extend({
  type: z.literal("ValueProps"),
  items: z
    .array(
      z.object({ icon: z.string(), title: z.string(), desc: z.string() })
    )
    .optional(),
});

const reviewsCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ReviewsCarousel"),
  reviews: z
    .array(
      z.object({ nameKey: z.string(), quoteKey: z.string() })
    )
    .optional(),
});

const productGridComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductGrid"),
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
    .array(
      z.object({ quote: z.string(), name: z.string().optional() })
    )
    .optional(),
});

const testimonialsComponentSchema = baseComponentSchema.extend({
  type: z.literal("Testimonials"),
  testimonials: z
    .array(
      z.object({ quote: z.string(), name: z.string().optional() })
    )
    .optional(),
});

const imageComponentSchema = baseComponentSchema.extend({
  type: z.literal("Image"),
  src: z.string().optional(),
  alt: z.string().optional(),
});

const textComponentSchema = baseComponentSchema.extend({
  type: z.literal("Text"),
  text: z.string().optional(),
});

const sectionComponentSchema: z.ZodType<SectionComponent> = baseComponentSchema.extend({
  type: z.literal("Section"),
  children: z.array(z.lazy(() => pageComponentSchema)).default([]),
});

export const pageComponentSchema: z.ZodType<PageComponent> = z.lazy(() =>
  z.discriminatedUnion("type", [
    heroBannerComponentSchema,
    valuePropsComponentSchema,
    reviewsCarouselComponentSchema,
    productGridComponentSchema,
    galleryComponentSchema,
    contactFormComponentSchema,
    contactFormWithMapComponentSchema,
    blogListingComponentSchema,
    testimonialsComponentSchema,
    testimonialSliderComponentSchema,
    imageComponentSchema,
    textComponentSchema,
    sectionComponentSchema,
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
  .default({ past: [], present: [], future: [] });

export const pageSchema = z.object({
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
});

export type Page = z.infer<typeof pageSchema>;

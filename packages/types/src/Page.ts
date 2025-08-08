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
   * Width of the rendered component. Can be a pixel value (e.g. "300px")
   * or a percentage (e.g. "50%").
   */
  width?: string;
  /**
   * Height of the rendered component. Can be a pixel value or percentage.
   */
  height?: string;
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
  /**
   * Padding applied to the outer container when rendered.
   * Accepts any valid CSS padding value or Tailwind class.
   */
  padding?: string;
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

export interface TextComponent extends PageComponentBase {
  type: "Text";
  text?: string;
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
  | TextComponent;

export const pageComponentSchema: z.ZodType<PageComponent> = z
  .object({ id: z.string(), type: z.string() })
  .passthrough();

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
  components: z
    .array(z.object({ id: z.string(), type: z.string() }).passthrough())
    .default([]),
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

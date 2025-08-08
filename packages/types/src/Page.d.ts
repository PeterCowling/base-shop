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
export interface ReviewsCarouselComponent extends PageComponentBase {
    type: "ReviewsCarousel";
    reviews?: {
        nameKey: string;
        quoteKey: string;
    }[];
}
export interface ProductGridComponent extends PageComponentBase {
    type: "ProductGrid";
}
export interface GalleryComponent extends PageComponentBase {
    type: "Gallery";
    images?: {
        src: string;
        alt?: string;
    }[];
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
    posts?: {
        title: string;
        excerpt?: string;
        url?: string;
    }[];
}
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
export type PageComponent = HeroBannerComponent | ValuePropsComponent | ReviewsCarouselComponent | ProductGridComponent | GalleryComponent | ContactFormComponent | ContactFormWithMapComponent | BlogListingComponent | TestimonialsComponent | TestimonialSliderComponent | ImageComponent | TextComponent;
export declare const pageComponentSchema: z.ZodType<PageComponent>;
export interface HistoryState {
    past: PageComponent[][];
    present: PageComponent[];
    future: PageComponent[][];
}
export declare const historyStateSchema: z.ZodType<HistoryState>;
export declare const pageSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    status: z.ZodEnum<["draft", "published"]>;
    components: z.ZodDefault<z.ZodArray<z.ZodType<PageComponent, z.ZodTypeDef, PageComponent>, "many">>;
    seo: z.ZodObject<{
        title: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>;
        description: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        image: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        title: Partial<Record<"en" | "de" | "it", string>>;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }, {
        title: Partial<Record<"en" | "de" | "it", string>>;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodString;
    history: z.ZodOptional<z.ZodType<HistoryState, z.ZodTypeDef, HistoryState>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    slug: string;
    status: "draft" | "published";
    components: PageComponent[];
    seo: {
        title: Partial<Record<"en" | "de" | "it", string>>;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    history?: HistoryState | undefined;
}, {
    id: string;
    slug: string;
    status: "draft" | "published";
    seo: {
        title: Partial<Record<"en" | "de" | "it", string>>;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    components?: PageComponent[] | undefined;
    history?: HistoryState | undefined;
}>;
export type Page = z.infer<typeof pageSchema>;
//# sourceMappingURL=Page.d.ts.map
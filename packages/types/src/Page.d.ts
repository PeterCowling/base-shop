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
    /** Minimum number of items allowed for list components */
    minItems?: number;
    /** Maximum number of items allowed for list components */
    maxItems?: number;
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
}
/** Carousel of products; `minItems`/`maxItems` clamp visible products */
export interface ProductCarouselComponent extends PageComponentBase {
    type: "ProductCarousel";
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
export interface VideoBlockComponent extends PageComponentBase {
    type: "VideoBlock";
    src?: string;
    autoplay?: boolean;
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
export interface SectionComponent extends PageComponentBase {
    type: "Section";
    children?: PageComponent[];
}
export type PageComponent = HeroBannerComponent | ValuePropsComponent | ReviewsCarouselComponent | ProductGridComponent | ProductCarouselComponent | RecommendationCarouselComponent | GalleryComponent | ContactFormComponent | ContactFormWithMapComponent | BlogListingComponent | TestimonialsComponent | TestimonialSliderComponent | ImageComponent | VideoBlockComponent | TextComponent | SectionComponent;
export declare const pageSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    status: z.ZodEnum<["draft", "published"]>;
    components: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    seo: z.ZodObject<{
        title: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>;
        description: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        image: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        title: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }, {
        title: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    slug: string;
    status: "draft" | "published";
    components: z.objectOutputType<{
        id: z.ZodString;
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
    seo: {
        title: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}, {
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
    components?: z.objectInputType<{
        id: z.ZodString;
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
}>;
export type Page = z.infer<typeof pageSchema>;
//# sourceMappingURL=Page.d.ts.map

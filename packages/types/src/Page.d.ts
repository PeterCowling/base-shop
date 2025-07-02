export type PageStatus = "draft" | "published";
export interface SeoMeta {
    title: string;
    description?: string;
    image?: string;
}
export interface PageComponentBase {
    id: string;
    type: string;
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
export type PageComponent = HeroBannerComponent | ValuePropsComponent | ReviewsCarouselComponent | ProductGridComponent | GalleryComponent | ContactFormComponent | ContactFormWithMapComponent | BlogListingComponent | TestimonialsComponent | TestimonialSliderComponent;
export interface Page {
    id: string;
    slug: string;
    status: PageStatus;
    components: PageComponent[];
    seo: SeoMeta;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}
//# sourceMappingURL=Page.d.ts.map
import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import HeroBanner from "./HeroBanner";
import ProductCarousel from "./ProductCarousel";
import ProductGrid from "./ProductGrid.client";
import ReviewsCarousel from "./ReviewsCarousel";
import TestimonialSlider from "./TestimonialSlider";
import Testimonials from "./Testimonials";
import ValueProps from "./ValueProps";
export declare const organismRegistry: {
    readonly HeroBanner: typeof HeroBanner;
    readonly ValueProps: typeof ValueProps;
    readonly ReviewsCarousel: typeof ReviewsCarousel;
    readonly ProductGrid: typeof ProductGrid;
    readonly ProductCarousel: typeof ProductCarousel;
    readonly Gallery: typeof Gallery;
    readonly ContactForm: typeof ContactForm;
    readonly ContactFormWithMap: typeof ContactFormWithMap;
    readonly BlogListing: typeof BlogListing;
    readonly NewsletterForm: import("react").NamedExoticComponent<import("./molecules").NewsletterFormProps>;
    readonly PromoBanner: import("react").NamedExoticComponent<import("./molecules").PromoBannerProps>;
    readonly CategoryList: import("react").NamedExoticComponent<import("../../templates/CategoryCollectionTemplate").CategoryCollectionTemplateProps>;
    readonly Testimonials: typeof Testimonials;
    readonly TestimonialSlider: typeof TestimonialSlider;
};
export type OrganismBlockType = keyof typeof organismRegistry;
//# sourceMappingURL=organisms.d.ts.map
import { atomRegistry, moleculeRegistry, organismRegistry, containerRegistry, layoutRegistry, } from "../blocks";
export const CONTAINER_TYPES = Object.keys(containerRegistry);
export const defaults = {
    HeroBanner: { minItems: 1, maxItems: 5 },
    ValueProps: { minItems: 1, maxItems: 6 },
    ReviewsCarousel: { minItems: 1, maxItems: 10 },
    SearchBar: { placeholder: "Search products…", limit: 5 },
    ProductFilter: { showSize: true, showColor: true, showPrice: true },
    ProductGrid: {
        minItems: 1,
        maxItems: 3,
        desktopItems: 3,
        tabletItems: 2,
        mobileItems: 1,
        mode: "collection",
    },
    ProductCarousel: {
        minItems: 1,
        maxItems: 10,
        desktopItems: 4,
        tabletItems: 2,
        mobileItems: 1,
        mode: "collection",
    },
    RecommendationCarousel: { minItems: 1, maxItems: 4 },
    Testimonials: { minItems: 1, maxItems: 10 },
    TestimonialSlider: { minItems: 1, maxItems: 10 },
    ImageSlider: { minItems: 1, maxItems: 10 },
    AnnouncementBar: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
    },
    Lookbook: { minItems: 0, maxItems: 10 },
    MultiColumn: { columns: 2, gap: "1rem" },
    Divider: { width: "100%", height: "1px" },
    Spacer: { width: "100%", height: "1rem" },
};
export default defaults;

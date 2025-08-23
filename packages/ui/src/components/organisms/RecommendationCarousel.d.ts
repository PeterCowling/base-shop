import * as React from "react";
export interface RecommendationCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
    /** API endpoint providing recommended products. */
    endpoint: string;
    /** Minimum number of items visible per slide. */
    minItems?: number;
    /** Maximum number of items visible per slide. */
    maxItems?: number;
    /** Items shown on desktop viewports */
    desktopItems?: number;
    /** Items shown on tablet viewports */
    tabletItems?: number;
    /** Items shown on mobile viewports */
    mobileItems?: number;
    /** Tailwind class controlling gap between slides */
    gapClassName?: string;
    /** Function to calculate individual slide width */
    getSlideWidth?: (itemsPerSlide: number) => string;
}
/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API. The number of visible items
 * adapts to the current viewport width and is clamped between
 * the provided `minItems` and `maxItems` values.
 */
export declare function RecommendationCarousel({ endpoint, minItems, maxItems, desktopItems, tabletItems, mobileItems, gapClassName, getSlideWidth, className, ...props }: RecommendationCarouselProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=RecommendationCarousel.d.ts.map
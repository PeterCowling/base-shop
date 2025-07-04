import * as React from "react";
export interface RecommendationCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
    /** API endpoint providing recommended products. */
    endpoint: string;
    /** Number of items visible per slide. */
    itemsPerSlide?: number;
    /** Tailwind class controlling gap between slides */
    gapClassName?: string;
    /** Function to calculate individual slide width */
    getSlideWidth?: (itemsPerSlide: number) => string;
}
/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API.
 */
export declare function RecommendationCarousel({ endpoint, itemsPerSlide, gapClassName, getSlideWidth, className, ...props }: RecommendationCarouselProps): React.JSX.Element;

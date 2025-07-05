import * as React from "react";
import { Product } from "./ProductCard";
export interface ProductCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
    products: Product[];
    itemsPerSlide?: number;
    /** flex gap class applied to the inner scroller */
    gapClassName?: string;
    /**
     * Function to calculate the width of each slide based on
     * the current itemsPerSlide value. Should return a CSS
     * width value such as "33.333%".
     */
    getSlideWidth?: (itemsPerSlide: number) => string;
    className?: string;
}
/**
 * Horizontally scrollable carousel for product cards.
 * Items per slide can be controlled via the `itemsPerSlide` prop.
 */
export declare function ProductCarousel({ products, itemsPerSlide, gapClassName, getSlideWidth, className, ...props }: ProductCarouselProps): import("react/jsx-runtime").JSX.Element;

import { type StaticImageData } from "next/image";
import * as React from "react";
export interface Product {
    id: string;
    title: string;
    image: string | StaticImageData;
    price: number;
}
export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
    product: Product;
    onAddToCart?: (product: Product) => void;
    showImage?: boolean;
    showPrice?: boolean;
    ctaLabel?: string;
    /** Override default padding classes. */
    padding?: string;
    /** Optional width */
    width?: string | number;
    /** Optional height */
    height?: string | number;
    /** Optional margin classes */
    margin?: string;
}
export declare const ProductCard: React.ForwardRefExoticComponent<ProductCardProps & React.RefAttributes<HTMLDivElement>>;

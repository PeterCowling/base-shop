import * as React from "react";
import type { Product } from "../organisms/ProductCard";
export interface ProductComparisonTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    products: Product[];
}
/**
 * Display multiple products side by side for comparison.
 */
export declare function ProductComparisonTemplate({ products, className, ...props }: ProductComparisonTemplateProps): React.JSX.Element;

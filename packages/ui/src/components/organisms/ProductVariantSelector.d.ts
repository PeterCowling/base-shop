import * as React from "react";
export interface VariantSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
    colors?: string[];
    sizes?: string[];
    quantity?: number;
    onColorChange?: (color: string) => void;
    onSizeChange?: (size: string) => void;
    onQuantityChange?: (qty: number) => void;
    selectedColor?: string;
    selectedSize?: string;
}
/**
 * UI controls for selecting product variants (color, size, quantity).
 */
export declare function ProductVariantSelector({ colors, sizes, quantity, onColorChange, onSizeChange, onQuantityChange, selectedColor, selectedSize, className, ...props }: VariantSelectorProps): import("react/jsx-runtime").JSX.Element;

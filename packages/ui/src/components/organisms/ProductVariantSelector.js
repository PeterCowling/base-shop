import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { ColorSwatch } from "../atoms/ColorSwatch";
import { QuantityInput } from "../molecules/QuantityInput";
/**
 * UI controls for selecting product variants (color, size, quantity).
 */
export function ProductVariantSelector({ colors, sizes, quantity = 1, onColorChange, onSizeChange, onQuantityChange, selectedColor, selectedSize, className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-4", className), ...props, children: [colors && (_jsx("div", { className: "flex items-center gap-2", children: colors.map((c) => (_jsx(ColorSwatch, { color: c, selected: c === selectedColor, onClick: () => onColorChange?.(c) }, c))) })), sizes && (_jsx("select", { value: selectedSize, onChange: (e) => onSizeChange?.(e.target.value), className: "rounded border px-2 py-1", children: sizes.map((s) => (_jsx("option", { children: s }, s))) })), _jsx(QuantityInput, { value: quantity, onChange: onQuantityChange })] }));
}
